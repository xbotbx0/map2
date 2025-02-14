import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, update, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// تكوين Firebase باستخدام الإعدادات الخاصة بك
const firebaseConfig = {
    apiKey: "AIzaSyB9ZqQCZG9g3qclDz-kLHrNQparJT_iBXc",
    authDomain: "mypro-d8761.firebaseapp.com",
    databaseURL: "https://mypro-d8761-default-rtdb.firebaseio.com",
    projectId: "mypro-d8761",
    storageBucket: "mypro-d8761.appspot.com",
    messagingSenderId: "439741574644",
    appId: "1:439741574644:web:50b693546c7d32a5579da1"
};

// تهيئة التطبيق
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// مراقبة حالة المستخدم (إذا كان قد سجل الدخول أم لا)
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("المستخدم مسجل دخول:", user.uid);
        const userRef = ref(db, 'users/' + user.uid);

        // دالة لحفظ بيانات الموقع والسرعة في قاعدة البيانات
        window.saveToDB = (lat, lng, speed, heading) => {
            console.log("حفظ البيانات للمستخدم:", user.uid, { lat, lng, speed, heading });
            
            // تحديث بيانات المستخدم في قاعدة البيانات
            update(userRef, {
                latitude: lat,
                longitude: lng,
                speed: speed,
                heading: heading, // إضافة حقل الاتجاه
                timestamp: Date.now()
            }).then(() => {
                console.log("تم حفظ البيانات بنجاح");
            }).catch((error) => {
                console.error('خطأ في حفظ البيانات:', error);
            });
        
            // تحديث بيانات المستخدم في الواجهة
            onValue(userRef, (snapshot) => {
                const userData = snapshot.val();
                window.userInfo = {
                    username: userData?.username || 'غير معروف',
                    email: user.email,
                    speed: userData?.speed || 0,
                    heading: userData?.heading || 0, // إضافة الاتجاه هنا إذا لزم الأمر
                    coords: userData ? [userData.latitude, userData.longitude] : [0, 0]
                };
            });
        };
    } else {
        window.location.href = "login.html";
    }
});

// إضافة حدث لتسجيل الخروج عند الضغط على زر الخروج
document.querySelector('.logout-btn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error("خطأ في تسجيل الخروج:", error);
        alert("حدث خطأ أثناء محاولة تسجيل الخروج");
    }
});

const arrowIcon = L.divIcon({
    className: 'rotating-arrow',
    iconSize: [30, 30], 
    iconAnchor: [15, 15],
    html: '<div class="arrow"></div>'
});

let map = L.map('map', {
    zoomControl: false
}).setView([24.774265, 46.738586], 13);

let marker = null;
let path = [];
let polyline = null;
let isFirstUpdate = true;
let currentPosition = null;
let previousHeading = 0;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

const speedElement = document.getElementById('speed');
const centerButton = document.getElementById('centerButton');

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
        
        const arrowElement = marker.getElement().querySelector('.arrow');
        if (arrowElement) {
            arrowElement.style.transform = `rotate(${heading}deg)`;
        }
    } else {
        marker.setLatLng([lat, lng])
             .setPopupContent(createPopupContent(speed, lat, lng));
        
        const arrowElement = marker.getElement().querySelector('.arrow');
        if (arrowElement) {
            arrowElement.style.transform = `rotate(${heading}deg)`;
        }
    }

    path.push([lat, lng]);
    if (polyline) map.removeLayer(polyline);
    polyline = L.polyline(path, {color: 'red'}).addTo(map);

    speedElement.textContent = `السرعة: ${speed.toFixed(1)} كم/س`;

    if (isFirstUpdate) {
        map.setView([lat, lng], 13);
        isFirstUpdate = false;
    }

    if (typeof window.saveToDB === 'function') {
        window.saveToDB(lat, lng, speed.toFixed(1), heading);
    }
}

function handleError(error) {
    console.error('Geolocation error:', error);
    speedElement.textContent = 'خطأ في تحديد الموقع انقر للتحديث 🔄!';
}

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(updateLocation, handleError, {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 27000
    });
}

window.addEventListener('resize', () => {
    map.invalidateSize();
});

L.control.zoom({
    position: 'bottomright'
}).addTo(map);

function focusOnLocation() {
    if (currentPosition) {
        map.setView([currentPosition.lat, currentPosition.lng], 13);
        marker.openPopup();
        setTimeout(() => marker.closePopup(), 3000);
    } else {
        alert("لا يوجد موقع متاح حاليًا!");
    }
}

document.getElementById('centerButton').addEventListener('click', focusOnLocation);

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