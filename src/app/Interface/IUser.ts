export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  photoURL?: string;
  fullName?: string;
  rut?: string;
  createdAt?: Date;
  token?: string;
  role?: string;
}
