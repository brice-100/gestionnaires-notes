// ✅ IMPORT COMPLET ET CORRECT DES MODULES FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { 
  getFirestore, 
  setDoc, 
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// ===== CONFIGURATION FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyDWlbkcROJ-BWb_xl7BF5FhjKyPt7pTaFc",
  authDomain: "gi-student.firebaseapp.com",
  projectId: "gi-student",
  storageBucket: "gi-student.firebasestorage.app",
  messagingSenderId: "682281435673",
  appId: "1:682281435673:web:a67b7456467ceadf576088",
  measurementId: "G-DQWK270Q6Z"
};

// ===== INITIALISATION FIREBASE =====
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const authInstance = getAuth(app);
const db = getFirestore(app);

// ===== VARIABLES GLOBALES =====
let currentUser = null;
let userType = null;
let currentClass = null;
let studentClass = null;



// NAVIGATION 
function showAuth(type) {
  document.getElementById("homePage").style.display = "none";
  document.getElementById(`${type}AuthPage`).classList.add("active");
}

function backToHome() {
  document.getElementById("homePage").style.display = "block";
  document.querySelectorAll(".auth-page").forEach(page => {
    page.classList.remove("active");
  });
  document.querySelectorAll('form').forEach(form => {
    form.reset();
  });
  
  document.querySelectorAll(".error-message").forEach(el => {
    el.classList.remove("show");
  });
  document.querySelectorAll(".success-message").forEach(el => {
    el.classList.remove("show");
  });
}

//fonction pour basculer vers la page de connexion ou d'inscription en fonction du type d'utilisateur (élève ou enseignant)
function switchTab(type, userType) {
  const form1 = document.getElementById(`${userType}-login`);
  const form2 = document.getElementById(`${userType}-register`);
  const tabs = document.querySelectorAll(`#${userType}AuthPage .form-tab`);
  
  if (type === 'login') {
    form1.classList.add("active");
    form2.classList.remove("active");
    tabs[0].classList.add("active");
    tabs[1].classList.remove("active");
  } else {
    form1.classList.remove("active");
    form2.classList.add("active");
    tabs[0].classList.remove("active");
    tabs[1].classList.add("active");
  }
}


// VÉRIFICATION TYPE UTILISATEUR 
function checkUserType(uid) {
  
  getDoc(doc(db, "users", uid))
    .then((docSnap) => { 
      if (docSnap.exists()) {
        const userData = docSnap.data();
        userType = "enseignant";
        currentUser = { uid, ...userData };
        
        document.querySelectorAll(".auth-page").forEach(page => {
          page.classList.remove("active");
        });
        document.getElementById("homePage").style.display = "none";
        loadTeacherDashboard();
      } else {
    
        return getDoc(doc(db, "eleves", uid));
      }
    })
    .then((docSnap) => {
      if (docSnap && docSnap.exists()) {
        const userData = docSnap.data();
        userType = "eleve";
        currentUser = { uid, ...userData };
        studentClass = userData.classe;
        
        document.querySelectorAll(".auth-page").forEach(page => {
          page.classList.remove("active");
        });
        document.getElementById("homePage").style.display = "none";
        loadStudentDashboard();
      }
    })
    .catch((error) => {
      console.error("Erreur lors de la vérification du type d'utilisateur:", error);
    });
}

// FONCTION D'AUTHENTIFICATION ÉLÈVE 

function handleEleveLogin(event) {
  event.preventDefault();
  const email = document.getElementById("login-email-eleve").value.trim();
  const password = document.getElementById("login-password-eleve").value.trim();
  const errorDiv = document.getElementById("eleve-login-error");
  const loadingDiv = document.getElementById("eleve-login-loading");

   const button = event.target.querySelector('button[type="submit"]');
  const originalText = button.textContent;
  
  errorDiv.classList.remove("show");
  button.textContent = '⏳ Connexion en cours...';
  button.classList.add('btn-loading');
  button.disabled = true;
  
  
  signInWithEmailAndPassword(authInstance, email, password)
    .then((userCredential) => {
      checkUserType(userCredential.user.uid);
         button.textContent = originalText;
        button.classList.remove('btn-loading');
        button.disabled = false;
    })
    .catch((error) => {
      button.textContent = originalText;
        button.classList.remove('btn-loading');
        button.disabled = false;
      errorDiv.textContent = 'Email ou mot de passe incorrect';
      errorDiv.classList.add("show");
       
      
      setTimeout(() => {
        errorDiv.classList.remove("show");
      }, 2000);
    });
}

function handleEleveRegister(event) {
  event.preventDefault();
  
  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ '-]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const email = document.getElementById("register-email-eleve").value.trim();
  const password = document.getElementById("register-password-eleve").value.trim();
  const confirmPassword = document.getElementById("register-password-confirm-eleve").value.trim();
  const nom = document.getElementById("register-nom-eleve").value.trim();
  const prenom = document.getElementById("register-prenom-eleve").value.trim();
  const classe = document.getElementById("register-classe-eleve").value;
  const errorDiv = document.getElementById("eleve-register-error");
  const successDiv = document.getElementById("eleve-register-success");
  
  
  
  successDiv.classList.remove("show");
  
  const button = event.target.querySelector('button[type="submit"]');
  const originalText = button.textContent;

  // Validations
  if (password !== confirmPassword) {
    const errorConfirm = document.getElementById("error-register-passwordconfirm-eleve");
    errorConfirm.textContent = 'Les mots de passe ne correspondent pas ';
    errorConfirm.classList.add("show");
    return;
  }
  if (!passwordRegex.test(password)) {
    const errorPassword = document.getElementById("error-register-password-eleve");
    errorPassword.textContent = 'Le mot de passe doit contenir au moins 8 caractères, dont une lettre et un chiffre';
    errorPassword.classList.add("show");
    return;
  }
  if (!nameRegex.test(nom)){
    const errorNom = document.getElementById("error-register-nom-eleve");
    errorNom.textContent = 'Le nom doit contenir uniquement des lettres';
    errorNom.classList.add("show");
    return;
  }
  if (!nameRegex.test(prenom)){
    const errorPrenom = document.getElementById("error-register-prenom-eleve");
    errorPrenom.textContent = 'Le prénom doit contenir uniquement des lettres';
    errorPrenom.classList.add("show");
    return;
  }
  if (!emailRegex.test(email)) {
    const errorEmail = document.getElementById("error-register-email-eleve");
    errorEmail.textContent = 'Format d\'email invalide';
    errorEmail.classList.add("show");
    return;
  } 
   
  
  button.textContent = '⏳ Inscription en cours...';
  button.classList.add('btn-loading');
  button.disabled = true;

  createUserWithEmailAndPassword(authInstance, email, password)
    .then((userCredential) => {
      const uid = userCredential.user.uid;
      const eleveRef = doc(db, "eleves", uid);
      
      return setDoc(eleveRef, {
        nom: nom,
        prenom: prenom,
        classe: classe,
        email: email,
        type: "eleve",
        createdAt: new Date()
      });
    })
    .then(() => {
      button.textContent = 'Inscription reussie';
      button.classList.add("show");
      successDiv.textContent = 'Inscription réussie,Veuillez vous connecter.';
      successDiv.classList.add("show");
      clearFormInputs('eleve-register-form');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('btn-loading', 'btn-success');
        button.disabled = false;
        successDiv.classList.remove("show");
        switchTab('login', 'eleve');
      }, 2000);
    })
    .catch((error) => {
      console.log("Erreur inscription eleve", error);
          button.textContent = originalText;
        button.classList.remove('btn-loading', 'btn-error');
        button.disabled = false;

      if (error.code === 'auth/email-already-in-use') {
        errorDiv.textContent = 'Cet email est déjà utilisé';
      } else if(error.code === 'permission denied') {
        errorDiv.textContent = 'erreur de permission firestore';
      } else {
        errorDiv.textContent = error.message;
      }
      errorDiv.classList.add("show");
          setTimeout(() => {
         errorDiv.classList.remove("show");
      }, 2000);
    });
}

// ===== AUTHENTIFICATION ENSEIGNANT =====

function handleEnseignantLogin(event) {
  event.preventDefault();
  const email = document.getElementById("login-email-enseignant").value.trim();
  const password = document.getElementById("login-password-enseignant").value.trim();
  const errorDiv = document.getElementById("enseignant-login-error");
   const button = event.target.querySelector('button[type="submit"]');
  const originalText = button.textContent;
  
  errorDiv.classList.remove("show");
  button.textContent = '⏳ Connexion en cours...';
  button.classList.add('btn-loading');
  button.disabled = true;
  
  signInWithEmailAndPassword(authInstance, email, password) 
    .then((userCredential) => {
      checkIfTeacher(userCredential.user.uid)
      
        .then((isTeacher) => {
          if (!isTeacher) {
            // C'est un élève, pas un enseignant
            errorDiv.textContent = '❌ Cet email est inscrit comme élève, pas comme enseignant';
            errorDiv.classList.add("show");
            button.textContent = originalText;
            button.classList.remove('btn-loading');
            button.disabled = false;
            
            // Déconnecter l'utilisateur
            signOut(authInstance);
            return Promise.reject("Not a teacher");
          }
      checkUserType(userCredential.user.uid);
    });
     button.textContent = originalText;
        button.classList.remove('btn-loading');
        button.disabled = false
  })
    .catch((error) => {
            button.textContent = originalText;
             button.disabled = false;
        button.classList.remove('btn-loading');
      errorDiv.textContent = 'Email ou mot de passe incorrect';
      errorDiv.classList.add("show");

      setTimeout(() => {
        errorDiv.classList.remove("show");
      }, 5000);
    });
}
//fonction pour verifier que c'est un enseignant 
function checkIfTeacher(uid) {
  return new Promise((resolve) => {
    getDoc(doc(db, "users", uid))
      .then((docSnap) => {
        if (docSnap.exists()) {
          resolve(true);  // C'est dans "users", donc un enseignant
        } else {
          resolve(false);  // Pas dans "users", donc un élève
        }
      })
      .catch(() => {
        resolve(false);
      });
  });
}

 function handleEnseignantRegister(event) {
  event.preventDefault();
  
  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ '-]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const email = document.getElementById("register-email-enseignant").value.trim();
  const password = document.getElementById("register-password-enseignant").value.trim();
  const confirmPassword = document.getElementById("register-password-confirm-enseignant").value.trim();
  const nom = document.getElementById("register-nom-enseignant").value.trim();
  const prenom = document.getElementById("register-prenom-enseignant").value.trim();
  const matiere = document.getElementById("register-subject-enseignant").value;
  
  
  const classesCheckboxes = document.querySelectorAll('#enseignant-register input[name="classes"]:checked');
  const classes = Array.from(classesCheckboxes).map(cb => cb.value);
  
  const errorDiv = document.getElementById("enseignant-register-error");
  const successDiv = document.getElementById("enseignant-register-success");
  
 const button = event.target.querySelector('button[type="submit"]');
  const originalText = button.textContent;
  errorDiv.classList.remove("show");
  successDiv.classList.remove("show");
  
  // Validations
  if (password !== confirmPassword) {
    const errorConfirm = document.getElementById("error-register-passwordconfirm-enseignant");
    errorConfirm.textContent = 'Les mots de passe ne correspondent pas ';
    errorConfirm.classList.add("show");
    return;
  }
  if (classes.length === 0) {
    const errorClasse = document.getElementById("error-register-classe-enseignant");
    errorClasse.textContent = 'Sélectionner au moins une classe';
    errorClasse.classList.add("show");
    return;
  }
  if (!nameRegex.test(nom)){
   const errorNom = document.getElementById("error-register-nom-enseignant");
    errorNom.textContent = 'Le nom doit contenir uniquement des lettres';
    errorNom.classList.add("show");
    return;
  }
   if (!nameRegex.test(prenom)){
   const errorPrenom = document.getElementById("error-register-prenom-enseignant");
    errorPrenom.textContent = 'Le prenom doit contenir uniquement des lettres';
    errorPrenom.classList.add("show");
    return;
  }
  if (!passwordRegex.test(password)) {
    const errorPassword = document.getElementById("error-register-password-enseignant");
    errorPassword.textContent = 'Le mot de passe doit contenir au moins 8 caractères, dont une lettre et un chiffre';
    errorPassword.classList.add("show");
    return;
  }
  if (!emailRegex.test(email)) {
    const errorEmail = document.getElementById("error-register-email-enseignant");
    errorEmail.textContent = 'Format d\'email invalide';
    errorEmail.classList.add("show");
    return;
  }
  
  button.textContent = '⏳ Inscription en cours...';
  button.classList.add('btn-loading');
  button.disabled = true;

  //fonction qui verifie si matière+classe déjà enseigné par un autre enseignant
  checkTeacherClassConflict(matiere, classes)
    .then((conflict) => {
      if (conflict) {
        throw new Error( `❌ La matière "${matiere}" est déjà enseignée dans la classe "${conflict}". Choisissez une autre classe.`);
      }
    })
    .then(() => {
      console.log("Aucun conflit de matière+classe, création du compte enseignant...");
      return createUserWithEmailAndPassword(authInstance, email, password);
    })

    .then((userCredential) => {
      const uid = userCredential.user.uid;
      const enseignantRef = doc(db, "users", uid);
      
      return setDoc(enseignantRef, {
        nom: nom,
        prenom: prenom,
        classes: classes,
        email: email,
        matiere: matiere,
        type: "enseignant",
        createdAt: new Date()
      });
    })
    .then(() => {
      //  Succès
      button.textContent = '✅ Inscription réussie !';
      button.classList.add('btn-success');
      
      successDiv.textContent = 'Inscription réussie ! Veuillez vous connecter.';
      successDiv.classList.add("show");
      
      // Vider les champs
      clearFormInputs('enseignant-register-form');
      
      setTimeout(() => {
        //  Réinitialiser le bouton
        button.textContent = originalText;
        button.classList.remove('btn-loading', 'btn-success');
        button.disabled = false;
        
        successDiv.classList.remove("show");
        switchTab('login', 'enseignant');
      }, 2000);
    })
    .catch((error) => {
      console.log("erreur inscription enseignant:" , error);
      //  Erreur
       button.textContent = originalText;
        button.classList.remove('btn-loading', 'btn-error');
        button.disabled = false;
      
      if (error.code === 'auth/email-already-in-use') {
        errorDiv.textContent = 'Cet email est déjà utilisé';
      } else if(error.message.includes('déjà enseignée')) {
        errorDiv.textContent = error.message;
      } else if(error.code === 'permission denied') {
      errorDiv.textContent = 'erreur de permission firestore'
      } else {
        errorDiv.textContent = error.message;
      }
      errorDiv.classList.add("show");

        setTimeout(() => {
       errorDiv.classList.add("show");
      }, 2000);
    });
}
// Fonction pour vérifier les conflits de matière+classe pour les enseignants
// Fonction CORRIGÉE pour vérifier les conflits
function checkTeacherClassConflict(matiere, classes) {
  return new Promise((resolve, reject) => {
    console.log("🔍 Vérification conflit:", matiere, "Classes:", classes);
    
    try {
      // Construire la requête
      const q = query(
        collection(db, "users"),
        where("matiere", "==", matiere),
        where("type", "==", "enseignant")
      );
      
      console.log("📡 Envoi de la requête...");
      
      // Exécuter la requête avec gestion d'erreur
      getDocs(q)
        .then((snapshot) => {
          console.log("✅ Requête réussie");
          console.log("📊 Documents trouvés:", snapshot.size);
          
          // Vérifier les conflits
          for (const docSnap of snapshot.docs) {
            const enseignant = docSnap.data();
            console.log("Enseignant:", enseignant.nom, "Classes:", enseignant.classes);
            
            // Sécurité: vérifier que classes est un tableau
            if (!Array.isArray(enseignant.classes)) {
              console.warn("⚠️ classes n'est pas un tableau, ignorer");
              continue;
            }
            
            // Vérifier si une classe est en conflit
            for (const classe of classes) {
              if (enseignant.classes.includes(classe)) {
                console.error("⚠️ CONFLIT:", matiere, "en", classe);
                resolve(classe);  // Retourner le conflit
                return;
              }
            }
          }
          
          // Pas de conflit trouvé
          console.log("✅ Pas de conflit");
          resolve(null);
        })
        .catch((error) => {
          console.error("❌ ERREUR getDocs:", error.code, error.message);
          
          // IMPORTANT: Si erreur de permissions, ignorer et continuer
          if (error.code === 'permission-denied') {
            console.warn("⚠️ Erreur permissions, mais continuant...");
            resolve(null);  // Ignorer l'erreur, continuer l'inscription
          } else {
            // Autre type d'erreur = rejeter
            console.error("❌ Erreur non-permissions:", error);
            reject(error);
          }
        });
    } catch (error) {
      console.error("❌ ERREUR Exception:", error);
      reject(error);
    }
  });
}
// ===== DASHBOARD ÉLÈVE =====

function loadStudentDashboard() {
  document.getElementById("studentDashboard").classList.add("active");
  
  
  if (!currentUser) return;
  
  document.getElementById("student-name").textContent = `Bienvenue ${currentUser.prenom} ${currentUser.nom}`;
  document.getElementById("myClass").textContent = currentUser.classe;
  
  loadStudentGrades();
}
function loadStudentGrades() {
  const gradesGrid = document.getElementById("gradesGrid");
  
  if (!currentUser || !studentClass) {
    gradesGrid.innerHTML = '<div class="no-grades">Veuillez d\'abord vous connecter</div>';
    return;
  }
  
  const q = query(
    collection(db, "grades"),
    where("classe", "==", studentClass),
    where("studentId", "==", currentUser.uid)
  );
  
  onSnapshot(q, (snapshot) => {
    const allGrades = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      allGrades.push({
        id: doc.id,
        subject: data.subject,
        grade: data.grade,
        updatedAt: data.updatedAt,
        teacherName: data.teacherName
      });    
    });
    
    if (allGrades.length === 0) {
      gradesGrid.innerHTML = '<div class="no-grades">Aucune note disponible pour le moment.</div>';
    } else {
      gradesGrid.innerHTML = '';
      allGrades.forEach((gradeInfo) => {
        let gradeClass = '';
        if (gradeInfo.grade >= 16) {
          gradeClass = 'excellent';
        } else if (gradeInfo.grade >= 14) {
          gradeClass = 'bien';
        } else if (gradeInfo.grade >= 12) {
          gradeClass = 'assez-bien';
        } else if (gradeInfo.grade >= 10) {
          gradeClass = 'passable';
        } else {
          gradeClass = 'insuffisant';
        }
        
        const gradeElement = document.createElement('div');
        gradeElement.className = `grade-card ${gradeClass}`;
        
        
        let dateStr = 'N/A';
        if (gradeInfo.updatedAt) {
          try {
            dateStr = new Date(gradeInfo.updatedAt.toDate()).toLocaleDateString();
          } catch (e) {
            dateStr = 'N/A';
          }
        }
        
        gradeElement.innerHTML = `
          <h3>${gradeInfo.subject}</h3>
          <div class="grade-value ${gradeClass}">${gradeInfo.grade}/20</div>
          <div class="grade-date">Dernière mise à jour: ${dateStr}</div>
          <div class="grade-teacher">Enseignant: ${gradeInfo.teacherName || 'N/A'}</div>
        `;
        gradesGrid.appendChild(gradeElement);
      });
    }
  });
}

//  DASHBOARD ENSEIGNANT 

function loadTeacherDashboard() {
  document.getElementById("teacherDashboard").classList.add("active");
  
  if (!currentUser) return;
  
  const classes = currentUser.classes;
  const subject = currentUser.matiere;
  
  document.getElementById("subject-title").textContent = `Gérer les notes de ${subject}`;
  document.getElementById("teacher-name").textContent = `Matière: ${subject} | Classes: ${classes.join(', ')}`;
  
  const classTabsDiv = document.getElementById("classTabsTeacher");
  classTabsDiv.innerHTML = '';
  
  classes.forEach((classe, index) => {
    const tab = document.createElement('button');
    tab.className = 'class-tab' + (index === 0 ? ' active' : '');
    tab.textContent = classe;
    tab.onclick = () => selectTeacherClass(classe, subject);
    classTabsDiv.appendChild(tab);
  });
  
  currentClass = classes[0];
  loadTeacherStudents(currentClass, subject, currentUser.nom, currentUser.prenom);
}

function selectTeacherClass(classe, subject) {
  currentClass = classe;
  document.querySelectorAll('.class-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Puis ajouter à l'élément cliqué
  event.target.classList.add('active');
  
  loadTeacherStudents(classe, subject, currentUser.nom, currentUser.prenom);
}

function loadTeacherStudents(classe, subject, teacherNom, teacherPrenom) {

  const tbody = document.getElementById("students-tbody");
  tbody.innerHTML = '';
  
  const q = query(
    collection(db, "eleves"),
    where("classe", "==", classe)
  );
  
  getDocs(q).then((querySnapshot) => {//vider le tableau avant de remplir a nouveau
    tbody.innerHTML = '';
    
    if (querySnapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="7">Aucun élève trouvé pour cette classe.</td></tr>';
      return;
    }
    
    querySnapshot.forEach((doc) => {
      const studentData = doc.data();
      const studentId = doc.id;
      
      const gradeQuery = query(
        collection(db, "grades"),
        where("studentId", "==", studentId),
        where("subject", "==", subject),
        where("classe", "==", classe)
      );
      
      getDocs(gradeQuery).then((gradeSnapshot) => {
        let gradevalue = '';
        let gradeId = null;
        
        if (!gradeSnapshot.empty) {
          gradevalue = gradeSnapshot.docs[0].data().grade;
          gradeId = gradeSnapshot.docs[0].id;
        }
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
          <td>${studentData.nom}</td>
          <td>${studentData.prenom}</td>
          <td>${studentData.classe}</td>
          <td>
            <input 
              type="number" 
              class="grade-input" 
              value="${gradevalue}" 
              min="0" 
              max="20" 
              id="grade-${studentId}"
              data-student-id="${studentId}"
              data-subject="${subject}"
              data-class="${classe}"
              data-grade-id="${gradeId}"
            >
          </td>
          <td>
            <input 
              type="number" 
              class="grade-input" 
              placeholder="Note 2"
              min="0" 
              max="20"
            >
          </td>
          <td>
            <span class="history-icon" onclick="showHistory('${studentId}', '${subject}', '${classe}')">📋</span>
          </td>
          <td>
            <button class="save-btn" onclick="saveGrade('${studentId}', '${subject}', '${classe}', '${teacherNom} ${teacherPrenom}')">
              Enregistrer
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
    });
  });
}

// ===== GESTION DES NOTES =====

function saveGrade(studentId, subject, classe, teacherName) {
  
  const input = document.getElementById(`grade-${studentId}`);
  const gradevalue = input.value;


  if (!gradevalue || gradevalue === '') {
    alert('Veuillez entrer une note avant de l\'enregistrer.');
    return;
  }
  
  if (gradevalue < 0 || gradevalue > 20) {
    alert("La note doit être comprise entre 0 et 20");
    return;
  }
    const button = event.target;
  const originalText = button.textContent;
  
   button.textContent = '⏳ Enregistrement...';
  button.classList.add('btn-loading');
  button.disabled = true;

  const gradeData = {
    studentId: studentId,
    subject: subject,
    classe: classe,
    grade: parseFloat(gradevalue),
    teacherName: teacherName,
    teacherId: currentUser.uid,
    updatedAt: new Date()
  };
  
  const gradeDocId = `${studentId}_${subject}_${classe}`;
  
  setDoc(doc(db, "grades", gradeDocId), gradeData, { merge: true })
    .then(() => {
       button.textContent = '✅ Enregistrée';
      button.classList.add('btn-success');
      alert('Note enregistrée avec succès');

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('btn-loading', 'btn-success');
        button.disabled = false;
      }, 1500);
    })
    .catch((error) => {
         // ✅ Erreur
      button.textContent = '❌ Erreur';
      button.classList.add('btn-error');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('btn-loading', 'btn-error');
        button.disabled = false;
      }, 1500);
      alert('Erreur lors de l\'enregistrement de la note: ' + error.message);
    });
}

// ===== HISTORIQUE =====

function showHistory(studentId, subject, classe) {
  // ✅ CORRIGÉ: Parenthèses correctes
  const historyContent = document.getElementById('historyContent');
  historyContent.innerHTML = '<p>Chargement de l\'historique...</p>';
  
  const q = query(
    collection(db, "grades"),
    where("studentId", "==", studentId),
    where("subject", "==", subject),
    where("classe", "==", classe),
    orderBy("updatedAt", "desc")
  );
  
  getDocs(q)
    .then(snapshot => {
      if (snapshot.empty) {
        historyContent.innerHTML = '<p style="text-align: center; color: #999;">Aucun historique disponible</p>';
      } else {
        let html = '';
        snapshot.forEach(doc => {
          const data = doc.data();
          const date = new Date(data.updatedAt.toDate()).toLocaleString();
          html += `
            <div class="history-item">
              <strong>Note: ${data.grade}/20</strong><br>
              <span style="color: #999;">Date: ${date}</span><br>
              <span style="color: #999;">Par: ${data.teacherName}</span>
            </div>
          `;
        });
        historyContent.innerHTML = html;
      }
    });
  
  document.getElementById('historyOverlay').classList.add('active');
  document.getElementById('historyPopup').classList.add('active');
}

function closeHistory() {
  document.getElementById('historyOverlay').classList.remove('active');
  document.getElementById('historyPopup').classList.remove('active');
}

//fonction pour vider le formulaire 
function clearFormInputs(formId){
  const form = document.getElementById(formId);
  if(form){
    form.reset();
  }
}

//fonction de déconnexion
function logout() {
  signOut(authInstance)
    .then(() => {
      document.getElementById("studentDashboard").classList.remove("active");
      document.getElementById("teacherDashboard").classList.remove("active");
      currentUser = null;
      userType = null;
      currentClass = null;
      studentClass = null;
      backToHome();
    })
    .catch((error) => {
      alert('Erreur lors de la déconnexion');
    });
}

window.showAuth = showAuth;
window.backToHome = backToHome;
window.switchTab = switchTab;
window.handleEleveLogin = handleEleveLogin;
window.handleEleveRegister = handleEleveRegister;
window.handleEnseignantLogin = handleEnseignantLogin;
window.handleEnseignantRegister = handleEnseignantRegister;
window.logout = logout;
window.loadStudentGrades = loadStudentGrades;
window.selectTeacherClass = selectTeacherClass;
window.saveGrade = saveGrade;
window.showHistory = showHistory;
window.closeHistory = closeHistory;
window.clearFormInputs = clearFormInputs;





