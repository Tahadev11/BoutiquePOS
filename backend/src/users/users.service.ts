import {
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import {
  User,
  UserDocument,
} from './schemas/user.schema.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // Create the Admin account
  async createAdmin(username: string, password: string) {
    const existingUser = await this.userModel
      .findOne({ username })
      .exec();

    if (existingUser) {
      throw new ConflictException(
        'Username already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new this.userModel({
      username,
      password: hashedPassword,
      role: 'admin',
    });

    return admin.save();
  }

  // Find Admin by username
  async findByUsername(username: string) {
    return this.userModel
      .findOne({ username })
      .exec();
  }
}