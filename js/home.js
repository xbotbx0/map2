import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, update, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// تكوين Firebase
 // تكوين Firebase باستخدام الإعدادات الخاصة بك
 const firebaseConfig = {
    apiKey: "AIzaSyB9ZqQCZG9g3qclDz-kLHrNQparJT_iBXc", // مفتاح API للتطبيق
    authDomain: "mypro-d8761.firebaseapp.com", // نطاق المصادقة
    databaseURL: "https://mypro-d8761-default-rtdb.firebaseio.com", // عنوان قاعدة البيانات
    projectId: "mypro-d8761", // معرف المشروع في Firebase
    storageBucket: "mypro-d8761.appspot.com", // حاوية التخزين
    messagingSenderId: "439741574644", // معرف مرسل الرسائل
    appId: "1:439741574644:web:50b693546c7d32a5579da1" // معرف التطبيق في Firebase
};
// تهيئة التطبيق
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// جميع الدوال والمتغيرات من الـ script في home.html
// ... كل الكود الموجود في الـ script ينتقل هنا ...

   // مراقبة حالة المستخدم (إذا كان قد سجل الدخول أم لا)
   onAuthStateChanged(auth, (user) => {
    if (user) {  // إذا كان المستخدم قد سجل الدخول
        console.log("المستخدم مسجل دخول:", user.uid); // عرض معرف المستخدم المسجل دخوله
        const userRef = ref(db, 'users/' + user.uid);  // تحديد مرجع بيانات المستخدم في قاعدة البيانات

        // إعداد وظيفة الحذف التلقائي عند قطع الاتصال (تم التعليق هنا)
        // onDisconnect(userRef).remove();  // حذف البيانات عندما ينقطع الاتصال

        // دالة لحفظ بيانات الموقع والسرعة في قاعدة البيانات
        window.saveToDB = (lat, lng, speed) => {
            console.log("حفظ البيانات للمستخدم:", user.uid, { lat, lng, speed }); // طباعة بيانات الموقع والسرعة
            
            // تحديث بيانات المستخدم في قاعدة البيانات
            update(userRef, {
                latitude: lat, // تحديث خط العرض
                longitude: lng, // تحديث خط الطول
                speed: speed, // تحديث السرعة
                timestamp: Date.now() // تحديث الطابع الزمني
            }).then(() => {
                console.log("تم حفظ البيانات بنجاح"); // طباعة رسالة نجاح
            }).catch((error) => {
                console.error('خطأ في حفظ البيانات:', error); // طباعة رسالة خطأ في حال فشل حفظ البيانات
            });

            // إضافة مستمع لتحديث بيانات المستخدم في الوقت الحقيقي
            onValue(userRef, (snapshot) => {
                const userData = snapshot.val(); // الحصول على بيانات المستخدم من قاعدة البيانات
                window.userInfo = {
                    username: userData?.username || 'غير معروف', // الحصول على اسم المستخدم
                    email: user.email, // الحصول على البريد الإلكتروني للمستخدم
                    speed: userData?.speed || 0, // الحصول على السرعة
                    coords: userData ? [userData.latitude, userData.longitude] : [0, 0] // الحصول على الإحداثيات
                };
            });
        };
    } else {
        window.location.href = "login.html"; // إذا لم يكن المستخدم مسجلاً دخوله، إعادة التوجيه إلى صفحة تسجيل الدخول
    }
});

// إضافة حدث لتسجيل الخروج عند الضغط على زر الخروج
document.querySelector('.logout-btn').addEventListener('click', async () => {
    try {
        await signOut(auth); // تسجيل الخروج من Firebase
        window.location.href = 'login.html'; // إعادة التوجيه إلى صفحة تسجيل الدخول بعد الخروج
    } catch (error) {
        console.error("خطأ في تسجيل الخروج:", error); // طباعة رسالة خطأ في حال فشل تسجيل الخروج
        alert("حدث خطأ أثناء محاولة تسجيل الخروج"); // عرض رسالة تنبيه في حال حدوث خطأ
    }
});






















     // تعريف رمز السهم القابل للدوران
     const arrowIcon = L.divIcon({
        className: 'rotating-arrow',
        iconSize: [30, 30], 
        iconAnchor: [15, 15],
        html: '<div class="arrow"></div>'
    });

    // تهيئة الخريطة
    let map = L.map('map', {
        zoomControl: false
    }).setView([24.774265, 46.738586], 13);

    // المتغيرات
    let marker = null;
    let path = [];
    let polyline = null;
    let isFirstUpdate = true;
    let currentPosition = null;
    let previousHeading = 0;

    // إضافة طبقة الخريطة
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // عناصر الواجهة
    const speedElement = document.getElementById('speed');
    const centerButton = document.getElementById('centerButton');


   // دالة تحديث الموقع
   function updateLocation(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const speed = position.coords.speed * 3.6;
    const heading = position.coords.heading !== null ? position.coords.heading : previousHeading;

    currentPosition = { lat, lng };
    previousHeading = heading;

    if (!marker) {
        marker = L.marker([lat, lng], { 
            icon: arrowIcon
        }).bindPopup(createPopupContent(speed, lat, lng))
        .addTo(map);
        
        // تطبيق الدوران الأولي
        const arrowElement = marker.getElement().querySelector('.arrow');
        if (arrowElement) {
            arrowElement.style.transform = `rotate(${heading}deg)`;
        }
    } else {
        marker.setLatLng([lat, lng])
             .setPopupContent(createPopupContent(speed, lat, lng));
        
        // تحديث دوران السهم يدويًا
        const arrowElement = marker.getElement().querySelector('.arrow');
        if (arrowElement) {
            arrowElement.style.transform = `rotate(${heading}deg)`;
        }
    }





        // إضافة الإحداثيات إلى المسار
        path.push([lat, lng]);
        if (polyline) map.removeLayer(polyline);
        polyline = L.polyline(path, {color: 'red'}).addTo(map);

        speedElement.textContent = `السرعة: ${speed.toFixed(1)} كم/س`;

        if (isFirstUpdate) {
            map.setView([lat, lng], 13);
            isFirstUpdate = false;
        }

        if (typeof window.saveToDB === 'function') {
            window.saveToDB(lat, lng, speed.toFixed(1));
        }
    }





    // دالة لمعالجة الأخطاء في تحديد الموقع
    function handleError(error) {
        console.error('Geolocation error:', error);
        speedElement.textContent = 'خطأ في تحديد الموقع انقر للتحديث 🔄!'; // عرض رسالة خطأ
    }

    // إذا كانت خاصية تحديد الموقع مدعومة، نبدأ في مراقبة الموقع
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(updateLocation, handleError, {
            enableHighAccuracy: true, // تفعيل الدقة العالية
            maximumAge: 30000, // الحد الأقصى لعمر البيانات المخزنة
            timeout: 27000 // الحد الأقصى للوقت قبل انقضاء التحديد
        });
    }

    // تحديث حجم الخريطة عند تغيير حجم الشاشة
    window.addEventListener('resize', () => {
        map.invalidateSize(); // تحديث حجم الخريطة
    });

    // إضافة تحكم في التكبير/التصغير مع تغيير الموضع إلى أسفل يمين الصفحة
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // دالة التوسيط المعدلة التي تركز على الموقع الحالي
    function focusOnLocation() {
        if (currentPosition) {
            map.setView([currentPosition.lat, currentPosition.lng], 13); // توسيط الخريطة على الموقع الحالي
            marker.openPopup(); // فتح النافذة المنبثقة للمؤشر
            setTimeout(() => marker.closePopup(), 3000); // إغلاق النافذة المنبثقة بعد 3 ثواني
        } else {
            alert("لا يوجد موقع متاح حاليًا!"); // إذا لم يكن هناك موقع متاح، عرض تنبيه
        }
    }

    // إضافة حدث للنقر على زر التوسيط
    document.getElementById('centerButton').addEventListener('click', focusOnLocation);

    // دالة لإنشاء محتوى النافذة المنبثقة
    function createPopupContent(speed, lat, lng) {
        return `
            <div dir="rtl" style="text-align: right;">
                <h4 style="margin: 5px 0;">معلومات المستخدم</h4>
                <hr style="margin: 5px 0;">
                <b>الاسم:</b> ${window.userInfo?.username || 'غير معروف'}<br>
                <b>الإيميل:</b> ${window.userInfo?.email || 'غير معروف'}<br>
                <b>السرعة:</b> ${speed.toFixed(1)} كم/س<br>
                <b>الإحداثيات:</b><br>
                ${lat.toFixed(6)}, ${lng.toFixed(6)}
            </div>
        `;
    }


