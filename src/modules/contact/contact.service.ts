import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { ContactMessage, ContactMessageStatus } from './entities';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessage)
    private readonly contactRepository: Repository<ContactMessage>,
  ) {}

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

  async findAll(): Promise<ContactMessage[]> {
    return this.contactRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findUnread(): Promise<ContactMessage[]> {
    return this.contactRepository.find({
      where: { status: ContactMessageStatus.NEW },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string): Promise<{ message: string }> {
    const contactMessage = await this.contactRepository.findOne({
      where: { id },
    });

    if (!contactMessage) {
      throw new NotFoundException('Mensaje de contacto no encontrado');
    }

    contactMessage.status = ContactMessageStatus.READ;
    contactMessage.readAt = new Date();
    await this.contactRepository.save(contactMessage);

    return { message: 'Mensaje marcado como leido' };
  }

  async remove(id: string): Promise<{ message: string }> {
    const contactMessage = await this.contactRepository.findOne({
      where: { id },
    });

    if (!contactMessage) {
      throw new NotFoundException('Mensaje de contacto no encontrado');
    }

    await this.contactRepository.remove(contactMessage);
    return { message: 'Mensaje eliminado exitosamente' };
  }
}
