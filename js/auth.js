
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB9ZqQCZG9g3qclDz-kLHrNQparJT_iBXc",
  authDomain: "mypro-d8761.firebaseapp.com",
  databaseURL: "https://mypro-d8761-default-rtdb.firebaseio.com",
  projectId: "mypro-d8761",
  storageBucket: "mypro-d8761.appspot.com",
  messagingSenderId: "439741574644",
  appId: "1:439741574644:web:50b693546c7d32a5579da1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// عناصر DOM
const submitButton = document.getElementById("submit");
const signupButton = document.getElementById("sign-up");
const createAcctBtn = document.getElementById("create-acct-btn");
const returnBtn = document.getElementById("return-btn");
const mainForm = document.getElementById("main");
const createAcctForm = document.getElementById("create-acct");
const errorMessages = document.querySelectorAll('.error-message');

// إدارة حالة النماذج
const showForm = (show, hide) => {
  hide.classList.add('form-hidden');
  setTimeout(() => {
    hide.style.display = 'none';
    show.style.display = 'block';
    setTimeout(() => {
      show.classList.remove('form-hidden');
      show.classList.add('form-visible');
    }, 50);
  }, 400);
};

// إضافة تأثير التحميل على الأزرار
const handleButtonLoader = (button, isLoading) => {
  if (isLoading) {
    button.innerHTML = `<span class="loading-spinner">⏳</span> ${button.textContent}`;
    button.disabled = true;
  } else {
    button.innerHTML = button.textContent;
    button.disabled = false;
  }
};

// أحداث الأزرار
signupButton.addEventListener('click', () => showForm(createAcctForm, mainForm));
returnBtn.addEventListener('click', () => showForm(mainForm, createAcctForm));

// معالجة إنشاء الحساب
createAcctBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  handleButtonLoader(createAcctBtn, true);
  
  const username = document.getElementById('username-signup').value;
  const email = document.getElementById('email-signup').value;
  const confirmEmail = document.getElementById('confirm-email-signup').value;
  const password = document.getElementById('password-signup').value;
  const confirmPassword = document.getElementById('confirm-password-signup').value;

  if (!username || !email || !confirmEmail || !password || !confirmPassword) {
    createAcctForm.querySelector('.error-message').style.display = 'block';
    handleButtonLoader(createAcctBtn, false);
    return;
  }

  if (email !== confirmEmail) {
    alert('البريد الإلكتروني غير متطابق!');
    handleButtonLoader(createAcctBtn, false);
    return;
  }

  if (password !== confirmPassword) {
    alert('كلمة المرور غير متطابقة!');
    handleButtonLoader(createAcctBtn, false);
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: username });

    // حفظ معلومات المستخدم في قاعدة البيانات
    const userId = userCredential.user.uid;
    await set(ref(database, 'users/' + userId), {
      username: username,
      email: email
    });

    alert('تم إنشاء الحساب بنجاح!');
    window.location.href = 'home.html';
  } catch (error) {
    console.error('خطأ في إنشاء الحساب:', error);
    alert(`خطأ: ${error.message}`);
  } finally {
    handleButtonLoader(createAcctBtn, false);
  }
});

// معالجة تسجيل الدخول
submitButton.addEventListener('click', async (e) => {
  e.preventDefault();
  handleButtonLoader(submitButton, true);

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    window.location.href = 'home.html';
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    mainForm.querySelector('.error-message').style.display = 'block';
  } finally {
    handleButtonLoader(submitButton, false);
  }
});