const firebaseConfig = {
    apiKey: "AIzaSyAmbzRxqYFti6IEksy2WunKCVa_v8Gg0F0",
    authDomain: "market-digital-3d10e.firebaseapp.com",
    projectId: "market-digital-3d10e",
    storageBucket: "market-digital-3d10e.firebasestorage.app",
    messagingSenderId: "368580098929",
    appId: "1:368580098929:web:7e005211ceb83b3b9794d0",
    measurementId: "G-Q985QSMDDT"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let isLoginMode = true;

// --- ระบบ Auth ---
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('btnAuth').innerText = isLoginMode ? "เข้าสู่ระบบ" : "สมัครสมาชิก";
}

async function handleAuth() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        if (isLoginMode) await auth.signInWithEmailAndPassword(email, pass);
        else await auth.createUserWithEmailAndPassword(email, pass);
    } catch (e) { alert(e.message); }
}

auth.onAuthStateChanged(user => {
    document.getElementById('authView').style.display = user ? 'none' : 'flex';
    document.getElementById('appView').style.display = user ? 'block' : 'none';
    if (user) loadProducts();
});

function logout() { auth.signOut(); }

// --- ระบบจัดการรูปภาพ ---
function previewImg(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const img = document.getElementById('imgPre');
            img.src = reader.result;
            img.style.display = 'block';
            document.getElementById('uploadPlaceholder').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

// --- ส่งโพสต์ประกาศขาย ---
async function savePost() {
    const file = document.getElementById('pImage').files[0];
    const btn = document.getElementById('btnSave');
    
    if (!file) return alert("กรุณาเลือกรูปภาพสินค้า");

    btn.disabled = true;
    btn.innerText = "กำลังอัปโหลด...";

    try {
        // 1. อัปโหลดรูปไป Firebase Storage
        const fileRef = storage.ref(`products/${Date.now()}_${file.name}`);
        const snapshot = await fileRef.put(file);
        const imgUrl = await snapshot.ref.getDownloadURL();

        // 2. บันทึกข้อมูลลง Firestore
        await db.collection("market_posts").add({
            title: document.getElementById('pTitle').value,
            cat: document.getElementById('pCat').value,
            price: Number(document.getElementById('pPrice').value),
            desc: document.getElementById('pDesc').value,
            img: imgUrl,
            owner: auth.currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        closeModal('postModal');
        alert("ลงประกาศสำเร็จ!");
    } catch (e) { alert(e.message); } 
    finally {
        btn.disabled = false;
        btn.innerText = "ยืนยันโพสต์";
    }
}

// --- ดึงข้อมูลสินค้า ---
function loadProducts(filter = 'ทั้งหมด') {
    db.collection("market_posts").orderBy("createdAt", "desc").onSnapshot(snap => {
        const grid = document.getElementById('productGrid');
        grid.innerHTML = '';
        snap.forEach(doc => {
            const data = doc.data();
            if (filter !== 'ทั้งหมด' && data.cat !== filter) return;
            
            grid.innerHTML += `
                <div class="card">
                    <img src="${data.img}" class="card-img">
                    <small style="color:#64748b">${data.cat}</small>
                    <h3 style="margin:5px 0;">${data.title}</h3>
                    <p class="price-tag">฿${data.price.toLocaleString()}</p>
                    <button class="btn-primary" onclick="alert('ระบบแชทกำลังจะมา!')">💬 ติดต่อผู้ขาย</button>
                </div>`;
        });
    });
}

function filterCat(cat) {
    document.querySelectorAll('#catMenu li').forEach(li => li.classList.remove('active'));
    event.target.classList.add('active');
    loadProducts(cat);
}

// Helpers
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
