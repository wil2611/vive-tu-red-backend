import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';

type SafeUser = Omit<User, 'password' | 'refreshToken'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private sanitizeUser(user: User): SafeUser {
    const safeUser: Partial<User> = { ...user };
    delete safeUser.password;
    delete safeUser.refreshToken;
    return safeUser as SafeUser;
  }

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya esta registrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.sanitizeUser(await this.userRepository.save(user));
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.userRepository.find();
    return users.map((user) => this.sanitizeUser(user));
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findSafeById(id: string): Promise<SafeUser> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.sanitizeUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async updateMyProfile(
    userId: string,
    updateMyProfileDto: UpdateMyProfileDto,
  ): Promise<SafeUser> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const normalizedEmail =
      typeof updateMyProfileDto.email === 'string'
        ? updateMyProfileDto.email.trim()
        : undefined;
    const normalizedFirstName =
      typeof updateMyProfileDto.firstName === 'string'
        ? updateMyProfileDto.firstName.trim()
        : undefined;
    const normalizedLastName =
      typeof updateMyProfileDto.lastName === 'string'
        ? updateMyProfileDto.lastName.trim()
        : undefined;

    if (normalizedEmail !== undefined && normalizedEmail.length === 0) {
      throw new BadRequestException('El email no puede estar vacio');
    }

    if (normalizedFirstName !== undefined && normalizedFirstName.length === 0) {
      throw new BadRequestException('El nombre no puede estar vacio');
    }

    if (normalizedLastName !== undefined && normalizedLastName.length === 0) {
      throw new BadRequestException('El apellido no puede estar vacio');
    }

    if (normalizedEmail && normalizedEmail !== user.email) {
      const userWithSameEmail = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (userWithSameEmail) {
        throw new ConflictException('El email ya esta registrado');
      }
    }

    if (normalizedEmail !== undefined) {
      user.email = normalizedEmail;
    }

    if (normalizedFirstName !== undefined) {
      user.firstName = normalizedFirstName;
    }

    if (normalizedLastName !== undefined) {
      user.lastName = normalizedLastName;
    }

    return this.sanitizeUser(await this.userRepository.save(user));
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<SafeUser> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const userWithSameEmail = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (userWithSameEmail) {
        throw new ConflictException('El email ya esta registrado');
      }
    }

    const hashedPassword = updateUserDto.password
      ? await bcrypt.hash(updateUserDto.password, 10)
      : undefined;

    if (hashedPassword) {
      updateUserDto.password = hashedPassword;
    }

    Object.assign(user, updateUserDto);
    return this.sanitizeUser(await this.userRepository.save(user));
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.userRepository.remove(user);
    return { message: 'Usuario eliminado exitosamente' };
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    const hashedRefreshToken = refreshToken
      ? await bcrypt.hash(refreshToken, 10)
      : null;

    await this.userRepository.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async resetPassword(
    id: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException(
        'La contrasena debe tener al menos 6 caracteres',
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
    return { message: 'Contrasena actualizada exitosamente' };
  }

  async changeMyPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException(
        'La contrasena debe tener al menos 6 caracteres',
      );
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'La nueva contrasena debe ser diferente a la actual',
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('La contrasena actual no es valida');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return { message: 'Contrasena actualizada exitosamente' };
  }
}
