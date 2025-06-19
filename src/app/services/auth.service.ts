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
  private usersCollection: AngularFirestoreCollection<AppUser>;
  private currentUserEmailSubject: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(this.getStoredUserEmail());
  public currentUserEmail$: Observable<string | undefined> = this.currentUserEmailSubject.asObservable();
  private userRoleSubject = new BehaviorSubject<string | null>(localStorage.getItem('userRole'));
  public userRole$ = this.userRoleSubject.asObservable();

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {
    this.usersCollection = this.firestore.collection<AppUser>('Usuarios');
    this.initAuthListener(); // ✅ inicializa el listener al crear el servicio
  }

  private initAuthListener() {
    this.afAuth.authState.subscribe(async user => {
      if (user) {
        const uid = user.uid;
        localStorage.setItem('userId', uid);
        localStorage.setItem('currentUserEmail', user.email ?? '');

        const doc = await this.firestore.collection('Usuarios').doc(uid).get().toPromise();
        if (doc?.exists) {
          const userData = doc.data() as AppUser;
          const role = userData.role || '';
          this.setUserRole(role);
        }
      } else {
        // Si la sesión se pierde, limpiar datos
        this.userRoleSubject.next(null);
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('currentUserEmail');
      }
    });
  }

  getUserId(): string | null {
    return localStorage.getItem('userId') || null;
  }

  obtenerUsuarios(): Observable<AppUser[]> {
    return this.usersCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as AppUser;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }

  async getCurrentUser(): Promise<firebase.User | null> {
    return new Promise(resolve => {
      this.afAuth.onAuthStateChanged(user => {
        resolve(user);
      });
    });
  }

  async getUserData(userId: string): Promise<AppUser | null> {
    try {
      const userDoc = await this.firestore.collection('Usuarios').doc(userId).get().toPromise();
      return userDoc?.exists ? (userDoc.data() as AppUser) : null;
    } catch (error) {
      console.error('Error al obtener los datos del usuario:', error);
      return null;
    }
  }

  async registerUser(user: Omit<AppUser, 'token'>, password: string): Promise<Omit<AppUser, 'token'>> {
    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(user.email, password);
      console.log('Usuario registrado:', userCredential);

      if (userCredential.user) {
        await userCredential.user.sendEmailVerification();
      }

      const userData: Omit<AppUser, 'token'> = {
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
      return userData;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<AppUser | null> {
    const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
    const uid = userCredential.user?.uid;

    if (uid) {
      localStorage.setItem('userId', uid);
      localStorage.setItem('currentUserEmail', email);

      const userSnapshot = await this.firestore.collection<AppUser>('Usuarios', ref => ref.where('email', '==', email)).get().toPromise();
      if (userSnapshot && !userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data() as AppUser;
        const userRole = userData.role ?? '';
        this.setUserRole(userRole);
        return userData;
      }
    }
    return null;
  }

  setUserRole(role: string) {
    localStorage.setItem('userRole', role);
    this.userRoleSubject.next(role);
  }

async verifyUserByEmail(email: string): Promise<boolean> {
  try {
    const snapshot = await this.firestore
      .collection('Usuarios', ref => ref.where('email', '==', email))
      .get()
      .toPromise();

    return !!snapshot && !snapshot.empty;
  } catch (error) {
    console.error('Error al verificar el correo:', error);
    return false;
  }
}


  async resetPassword(email: string): Promise<void> {
    await this.afAuth.sendPasswordResetEmail(email);
  }

  getCurrentUserEmail(): Observable<string | null> {
    return this.afAuth.authState.pipe(
      map(user => user ? user.email : null)
    );
  }

  private getStoredUserEmail(): string | undefined {
    return localStorage.getItem('currentUserEmail') || undefined;
  }

  async getUserById(userId: string): Promise<AppUser | null> {
    try {
      const docSnapshot = await this.firestore.collection('Usuarios').doc(userId).get().toPromise();
      return docSnapshot?.exists ? (docSnapshot.data() as AppUser) : null;
    } catch (error) {
      console.error('Error al obtener el usuario por ID:', error);
      return null;
    }
  }

  async updateUser(user: AppUser): Promise<void> {
    const updateData: any = {};

    if (user.photoURL !== undefined) updateData.photoURL = user.photoURL;
    if (user.email !== undefined) updateData.email = user.email;

    await this.firestore.collection('Usuarios').doc(user.uid).update(updateData);
  }

  async logout() {
    await this.afAuth.signOut();
    localStorage.clear();
    this.userRoleSubject.next(null);
  }
}
