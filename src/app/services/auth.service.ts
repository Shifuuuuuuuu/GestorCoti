import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { AppUser } from '../Interface/IUser';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usersCollection: AngularFirestoreCollection<AppUser>;  // Usa AppUser en lugar de User
  private currentUserEmailSubject: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(this.getStoredUserEmail());
  public currentUserEmail$: Observable<string | undefined> = this.currentUserEmailSubject.asObservable();

  constructor(private firestore: AngularFirestore, private afAuth: AngularFireAuth) {
    this.usersCollection = this.firestore.collection<AppUser>('Usuarios');  // Usa AppUser en lugar de User
  }

  getUserId(): string | null {
    return localStorage.getItem('id') || null;
  }

  // Obtener todos los usuarios registrados en Firestore
  obtenerUsuarios(): Observable<AppUser[]> {  // Cambia User por AppUser
    return this.usersCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as AppUser;  // Cambia User por AppUser
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }


  async getCurrentUser(): Promise<firebase.User | null> {  // Usamos el tipo firebase.User
    return this.afAuth.currentUser;
  }

  // Obtener los datos de un usuario por su ID
  async getUserData(userId: string): Promise<AppUser | null> {  // Cambia User por AppUser
    try {
      const userDoc = await this.firestore.collection('Usuarios').doc(userId).get().toPromise();
      return userDoc?.exists ? (userDoc.data() as AppUser) : null;  // Cambia User por AppUser
    } catch (error) {
      console.error('Error al obtener los datos del usuario:', error);
      return null;
    }
  }

  // Método para registrar un usuario con autenticación y enviar verificación de correo
  async registerUser(user: Omit<AppUser, 'token'>, password: string): Promise<Omit<AppUser, 'token'>> {  // Cambia User por AppUser
    try {
      await this.afAuth.signOut();

      const userCredential = await this.afAuth.createUserWithEmailAndPassword(user.email, password);
      console.log('Usuario registrado en Firebase Authentication:', userCredential);

      if (userCredential.user) {
        await userCredential.user.sendEmailVerification();
        console.log('Correo de verificación enviado a:', user.email);
      }

      const userData: Omit<AppUser, 'token'> = {  // Cambia User por AppUser
        uid: userCredential.user?.uid || '',
        email: user.email,
        displayName: user.displayName,
        phone: user.phone,
        photoURL: user.photoURL,
        fullName: user.fullName,
        rut: user.rut,
        createdAt: new Date(),
      };

      await this.firestore.collection<Omit<AppUser, 'token'>>('Usuarios').doc(userData.uid).set(userData);
      console.log('Datos del usuario guardados en Firestore:', userData);

      return userData;
    } catch (error) {
      console.error('Error al registrar en Firebase Authentication:', error);
      throw error;
    }
  }

  // Método para iniciar sesión
  async login(email: string, password: string): Promise<AppUser | null> {  // Cambia User por AppUser
    const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
    const uid = userCredential.user?.uid;

    if (uid) {
      const userSnapshot = await this.firestore.collection<AppUser>('Usuarios', ref => ref.where('email', '==', email)).get().toPromise();

      if (userSnapshot && !userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data() as AppUser;  // Cambia User por AppUser

        // Guardar el tipo de usuario en localStorage
        localStorage.setItem('userType', 'usuario');
        localStorage.setItem('id', uid);

        return userData;
      }
    }
    return null;
  }

  // Método para verificar si un usuario está registrado por correo
  async verifyUserByEmail(email: string): Promise<boolean> {
    try {
      const snapshot = await this.firestore
        .collection('Usuarios', ref => ref.where('email', '==', email))
        .get()
        .toPromise();

      if (snapshot && !snapshot.empty) {
        console.log('El correo ya existe en la base de datos.');
        return true;
      } else {
        console.log('El correo no existe en la base de datos.');
        return false;
      }
    } catch (error) {
      console.error('Error al verificar el correo:', error);
      throw error;
    }
  }

  // Método para restablecer la contraseña
  async resetPassword(email: string): Promise<void> {
    try {
      await this.afAuth.sendPasswordResetEmail(email);
      console.log('Correo de restablecimiento de contraseña enviado.');
    } catch (error) {
      console.error('Error al enviar correo de restablecimiento de contraseña:', error);
      throw error;
    }
  }

  // Obtener el correo electrónico actual del usuario
  getCurrentUserEmail(): Observable<string | null> {
    return this.afAuth.authState.pipe(
      map(user => user ? user.email : null)
    );
  }

  // Método privado para obtener el correo electrónico desde localStorage
  private getStoredUserEmail(): string | undefined {
    return localStorage.getItem('currentUserEmail') || undefined;
  }

  // Método para obtener un usuario por ID
  async getUserById(userId: string): Promise<AppUser | null> {  // Cambia User por AppUser
    try {
      const userDoc = await this.firestore.collection('Usuarios').doc(userId).get().toPromise();

      if (userDoc && userDoc.exists) { // Comprobamos si userDoc es definido y si existe el documento
        return userDoc.data() as AppUser;  // Si existe, devolvemos los datos del documento como AppUser
      } else {
        console.log('Documento no encontrado.');
        return null;  // Si no existe el documento, devolvemos null
      }
    } catch (error) {
      console.error('Error al obtener usuario por ID:', error);
      throw error;  // Lanzamos el error para manejarlo en otra parte si es necesario
    }
  }

  // Método para actualizar los datos del usuario en Firestore y Firebase Authentication
  async updateUser(user: AppUser): Promise<void> {  // Cambia User por AppUser
    try {
      // Actualizar solo los campos necesarios en Firestore
      await this.firestore.collection('Usuarios').doc(user.uid).update({
        photoURL: user.photoURL,
        email: user.email,
      });

      console.log('Usuario actualizado en Firestore.');
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
      throw error;
    }
  }

  // Método para cerrar sesión
  async logout() {
    return this.afAuth.signOut();
  }
}
