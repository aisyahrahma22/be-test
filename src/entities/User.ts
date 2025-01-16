export interface UserJWTDAO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  country: string;
  role: string;
}

export interface UserLoginDTO {
  email: string;
  password: string;
}

export interface UserRegisterDTO {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  country: string;
  email: string;
  password: string;
  role: string;
  about?: string;  // Optional field
}

// Exclude keys from user
export function exclude<User, Key extends keyof User>(
user: User,
...keys: Key[]
): Omit<User, Key> {
for (let key of keys) {
  delete user[key];
}
return user;
}
