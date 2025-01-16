import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRegisterDTO } from '$entities/User'; 
import { PrismaClient, Roles, User } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import Logger from '$pkg/logger';
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    return await prisma.user.findUnique({
      where: { email: email },
    });
  } catch (error) {
    Logger.error(`Error finding user by email: ${error}`);
    return null;
  }
}

export async function createUser(userData: UserRegisterDTO): Promise<User> {
  const hashedPassword = await bcrypt.hash(userData.password, 10); 
  const newUser = await prisma.user.create({
    data: {
      id: uuidv4(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber,
      country: userData.country,
      email: userData.email,
      password: hashedPassword,
      role: userData.role == Roles.ADMIN ? Roles.ADMIN : 'USER',
      about: userData.about || '',
    },
  });
  return newUser;
}

export async function register(firstName: string, lastName: string, phoneNumber: string, country: string, email: string, password: string, role: any, about?: any) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return { status: false, message: 'Email already registered' };
  }

  try {
    const newUser = await createUser({
      firstName, 
      lastName, 
      phoneNumber, 
      country, 
      email, 
      password, 
      role: role == Roles.ADMIN ? Roles.ADMIN : 'USER',
      about
    });
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '1h' });

    return {
      status: true,
      data: {
        token,
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phoneNumber: newUser.phoneNumber,
          country: newUser.country,
          email: newUser.email,
          about: newUser.about,
          role: newUser.role
        },
      },
    };
  } catch (error) {
    Logger.error(`Error during registration: ${error}`);
    return { status: false, message: 'An error occurred on the server' };
  }
}

export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    return { status: false, message: 'Invalid email or password' };
  }
  let isPasswordValid = null
  if(user.password) isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return { status: false, message: 'Invalid email or password' };
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

  return {
    status: true,
    data: {
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        country: user.country,
        email: user.email,
        about: user.about,
        role: user.role
      },
    },
  };
}
