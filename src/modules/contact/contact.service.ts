import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, MoreThanOrEqual, Repository } from 'typeorm';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { ListAdminContactMessagesDto } from './dto/list-admin-contact-messages.dto';
import { ContactMessage, ContactMessageStatus } from './entities';

export type AdminContactMessageView = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  ip?: string | null;
  userAgent?: string | null;
};

export type ContactMessageStatusTotals = {
  new: number;
  read: number;
  in_progress: number;
  responded: number;
};

export type AdminContactMessagesPage = {
  items: AdminContactMessageView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalAll: number;
    statusTotals: ContactMessageStatusTotals;
  };
};

@Injectable()
export class ContactService {
  private static readonly DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

  constructor(
    @InjectRepository(ContactMessage)
    private readonly contactRepository: Repository<ContactMessage>,
  ) {}

  private toAdminView(
    message: ContactMessage,
    includeSensitiveMetadata: boolean,
  ): AdminContactMessageView {
    const base: AdminContactMessageView = {
      id: message.id,
      name: message.name,
      email: message.email,
      subject: message.subject,
      message: message.message,
      status: message.status,
      readAt: message.readAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };

    if (!includeSensitiveMetadata) {
      return base;
    }

    return {
      ...base,
      ip: message.ip ?? null,
      userAgent: message.userAgent ?? null,
    };
  }

  private async findByIdOrFail(id: string): Promise<ContactMessage> {
    const message = await this.contactRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Mensaje de contacto no encontrado');
    }

    return message;
  }

  async create(
    createContactMessageDto: CreateContactMessageDto,
    metadata?: { ip?: string; userAgent?: string },
  ): Promise<{ message: string }> {
    const duplicateWindowStart = new Date(
      Date.now() - ContactService.DUPLICATE_WINDOW_MS,
    );
    const recentlySubmitted = await this.contactRepository.findOne({
      where: {
        email: createContactMessageDto.email,
        subject: createContactMessageDto.subject,
        message: createContactMessageDto.message,
        createdAt: MoreThanOrEqual(duplicateWindowStart),
      },
      order: { createdAt: 'DESC' },
    });

    if (recentlySubmitted) {
      throw new HttpException(
        'Ya recibimos un mensaje similar hace poco. Intenta de nuevo en unos minutos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const contactMessage = this.contactRepository.create({
      ...createContactMessageDto,
      status: ContactMessageStatus.NEW,
      ip: metadata?.ip,
      userAgent: metadata?.userAgent,
      readAt: null,
    });

    await this.contactRepository.save(contactMessage);
    return { message: 'Mensaje enviado exitosamente' };
  }

  async listAdminMessages(
    query: ListAdminContactMessagesDto,
    includeSensitiveMetadata: boolean,
  ): Promise<AdminContactMessagesPage> {
    const requestedPage = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const safeSearch = (query.q ?? '').trim();

    const baseBuilder = this.contactRepository.createQueryBuilder('contact');

    if (safeSearch.length > 0) {
      const term = `%${safeSearch}%`;
      baseBuilder.andWhere(
        new Brackets((subQuery) => {
          subQuery
            .where('contact.name ILIKE :term', { term })
            .orWhere('contact.email ILIKE :term', { term })
            .orWhere('contact.subject ILIKE :term', { term });

          // El campo message suele ser el mas pesado; evitamos barrerlo con
          // consultas demasiado cortas que suelen ser ruido.
          if (safeSearch.length >= 3) {
            subQuery.orWhere('contact.message ILIKE :term', { term });
          }
        }),
      );
    }

    const statusRows = await baseBuilder
      .clone()
      .select('contact.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('contact.status')
      .getRawMany<{ status: ContactMessageStatus; count: string }>();

    const statusTotals: ContactMessageStatusTotals = {
      new: 0,
      read: 0,
      in_progress: 0,
      responded: 0,
    };

    for (const row of statusRows) {
      statusTotals[row.status] = Number(row.count);
    }

    const totalAll =
      statusTotals.new +
      statusTotals.read +
      statusTotals.in_progress +
      statusTotals.responded;

    const builder = baseBuilder.clone().orderBy('contact.createdAt', 'DESC');

    if (query.status) {
      builder.andWhere('contact.status = :status', { status: query.status });
    }

    const [initialItems, total] = await builder
      .skip((requestedPage - 1) * limit)
      .take(limit)
      .getManyAndCount();
    let items = initialItems;

    const totalPages = Math.max(1, Math.ceil(total / limit));
    let page = requestedPage;

    if (total > 0 && requestedPage > totalPages) {
      page = totalPages;
      items = await builder
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();
    }

    return {
      items: items.map((item) =>
        this.toAdminView(item, includeSensitiveMetadata),
      ),
      total,
      page,
      limit,
      totalPages,
      summary: {
        totalAll,
        statusTotals,
      },
    };
  }

  async markAsRead(
    id: string,
    includeSensitiveMetadata: boolean,
  ): Promise<{ message: string; item: AdminContactMessageView }> {
    const contactMessage = await this.findByIdOrFail(id);
    let shouldSave = false;

    if (contactMessage.status === ContactMessageStatus.NEW) {
      contactMessage.status = ContactMessageStatus.READ;
      shouldSave = true;
    }

    if (!contactMessage.readAt) {
      contactMessage.readAt = new Date();
      shouldSave = true;
    }

    const updatedMessage = shouldSave
      ? await this.contactRepository.save(contactMessage)
      : contactMessage;

    return {
      message: 'Mensaje marcado como leido',
      item: this.toAdminView(updatedMessage, includeSensitiveMetadata),
    };
  }

  async updateStatus(
    id: string,
    nextStatus: ContactMessageStatus,
    includeSensitiveMetadata: boolean,
  ): Promise<{ message: string; item: AdminContactMessageView }> {
    const contactMessage = await this.findByIdOrFail(id);
    let shouldSave = false;

    if (contactMessage.status !== nextStatus) {
      contactMessage.status = nextStatus;
      shouldSave = true;
    }

    if (nextStatus === ContactMessageStatus.NEW) {
      if (contactMessage.readAt !== null) {
        contactMessage.readAt = null;
        shouldSave = true;
      }
    } else if (!contactMessage.readAt) {
      contactMessage.readAt = new Date();
      shouldSave = true;
    }

    const updatedMessage = shouldSave
      ? await this.contactRepository.save(contactMessage)
      : contactMessage;

    return {
      message: 'Estado del mensaje actualizado',
      item: this.toAdminView(updatedMessage, includeSensitiveMetadata),
    };
  }

  async remove(id: string): Promise<{ message: string }> {
    const contactMessage = await this.findByIdOrFail(id);

    await this.contactRepository.remove(contactMessage);
    return { message: 'Mensaje eliminado exitosamente' };
  }
}
