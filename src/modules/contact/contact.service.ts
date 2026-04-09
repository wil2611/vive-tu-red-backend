import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
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

export type AdminContactMessagesPage = {
  items: AdminContactMessageView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

@Injectable()
export class ContactService {
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

    const builder = this.contactRepository
      .createQueryBuilder('contact')
      .orderBy('contact.createdAt', 'DESC');

    if (query.status) {
      builder.andWhere('contact.status = :status', { status: query.status });
    }

    if (safeSearch.length > 0) {
      const term = `%${safeSearch}%`;
      builder.andWhere(
        new Brackets((subQuery) => {
          subQuery
            .where('contact.name ILIKE :term', { term })
            .orWhere('contact.email ILIKE :term', { term })
            .orWhere('contact.subject ILIKE :term', { term })
            .orWhere('contact.message ILIKE :term', { term });
        }),
      );
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
