// Import everything from firebase.js
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  ref,
  set,
  push
} from "./firebase.js";

/* =======================================================
   GLOBAL CONTROL FLAG
======================================================= */
let isSigningUp = false;

/* =======================================================
   SIGN UP
======================================================= */
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    isSigningUp = true;

    const name = document.getElementById("name")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;
    const background = document.getElementById("background")?.value || null;
    const linkedin = document.getElementById("linkedin")?.value || null;
    const referral = document.getElementById("referral")?.value.trim() || null;

    const errorEl = document.getElementById("signupError");
    const successEl = document.getElementById("signupSuccess");

    if (errorEl) errorEl.textContent = "";
    if (successEl) successEl.textContent = "";

    if (!name || !email || !password) {
      if (errorEl) errorEl.textContent = "All required fields must be filled.";
      isSigningUp = false;
      return;
    }

    if (password.length < 6) {
      if (errorEl) errorEl.textContent = "Password must be at least 6 characters.";
      isSigningUp = false;
      return;
    }

    const termsCheckbox = document.getElementById("terms");
    if (termsCheckbox && !termsCheckbox.checked) {
      if (errorEl) errorEl.textContent = "Please agree to the Terms of Service.";
      isSigningUp = false;
      return;
    }

    try {
      const submitBtn = document.getElementById("signupBtn");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Creating Account...";
      }

      // Create user
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // Send email verification
      await sendEmailVerification(user);

      const referralCode = "FFL" + user.uid.slice(0, 6).toUpperCase();

      // Save user profile
      await set(ref(db, `users/${user.uid}`), {
        profile: {
          name,
          email,
          background,
          linkedin,
          createdAt: Date.now(),
          emailVerified: false,
          lastLogin: null,
        },
        membership: {
          level: "Free",
          status: "active",
          joinedAt: Date.now(),
        },
        referral: {
          code: referralCode,
          referredBy: referral,
        },
        activity: {
          eventsAttended: 0,
          downloads: 0,
        },
      });

      // Welcome notification
      await push(ref(db, `notifications/${user.uid}`), {
        message:
          "🎉 Welcome to Future Finance Leaders (FFL)! Please verify your email before logging in.",
        read: false,
        time: Date.now(),
        type: "welcome",
      });

      // Track referral
      if (referral) {
        await push(ref(db, `referralTracking`), {
          referrerCode: referral,
          referredUserId: user.uid,
          timestamp: Date.now(),
        });
      }

      // Sign out after signup
      await signOut(auth);
      isSigningUp = false;

      if (successEl) {
        successEl.innerHTML =
          "<strong>✓ Account Created Successfully!</strong><br>Please verify your email, then login.";
        successEl.style.display = "block";
      }

      signupForm.reset();

      setTimeout(() => {
        window.location.href =
          "login.html?signup=success&email=" +
          encodeURIComponent(email);
      }, 4000);

    } catch (err) {
      isSigningUp = false;

      const submitBtn = document.getElementById("signupBtn");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Account";
      }

      if (errorEl) {
        let errorMessage = err.message;

        if (err.code === "auth/email-already-in-use") {
          errorMessage = "This email is already registered.";
        } else if (err.code === "auth/invalid-email") {
          errorMessage = "Invalid email address.";
        } else if (err.code === "auth/weak-password") {
          errorMessage = "Password too weak (min 6 characters).";
        }

        errorEl.innerHTML = `<strong>✗ Error:</strong> ${errorMessage}`;
        errorEl.style.display = "block";
      }
    }
  });
}

/* =======================================================
   LOGIN
======================================================= */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value;

    const errorEl = document.getElementById("loginError");
    const successEl = document.getElementById("loginSuccess");

    if (errorEl) errorEl.textContent = "";
    if (!email || !password) {
      if (errorEl) errorEl.textContent = "Email and password required.";
      return;
    }

    try {
      const submitBtn = document.getElementById("loginBtn");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Logging in...";
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Block login if not verified
      if (!user.emailVerified) {
        await signOut(auth);
        if (errorEl) {
          errorEl.innerHTML =
            "<strong>✗ Error:</strong> Please verify your email before logging in.";
          errorEl.style.display = "block";
        }
        return;
      }

      // Update last login
      await set(
        ref(db, `users/${user.uid}/profile/lastLogin`),
        Date.now()
      );

      if (successEl) {
        successEl.innerHTML =
          "<strong>✓ Login successful! Redirecting...</strong>";
        successEl.style.display = "block";
      }

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);

    } catch (err) {
      if (errorEl) {
        errorEl.innerHTML =
          "<strong>✗ Error:</strong> Invalid email or password.";
        errorEl.style.display = "block";
      }
    }
  });
}

/* =======================================================
   LOGOUT
======================================================= */
window.logout = async function () {
  if (confirm("Are you sure you want to logout?")) {
    await signOut(auth);
    window.location.href = "login.html?logout=success";
  }
};

/* =======================================================
   AUTH GUARD
======================================================= */
onAuthStateChanged(auth, (user) => {
  if (isSigningUp) return;

  const currentPage = window.location.pathname.split("/").pop();
  const protectedPages = ["dashboard.html", "profile.html"];
  const authPages = ["login.html", "register.html"];

  if (user) {
    if (authPages.includes(currentPage)) {
      window.location.href = "dashboard.html";
    }
  } else {
    if (protectedPages.includes(currentPage)) {
      window.location.href = "login.html";
    }
  }
});

/* =======================================================
   CHECK SIGNUP SUCCESS
======================================================= */
function checkSignupSuccess() {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");

  if (email) {
    const emailInput = document.getElementById("loginEmail");
    if (emailInput) emailInput.value = decodeURIComponent(email);
  }
}

if (window.location.pathname.includes("login.html")) {
  document.addEventListener("DOMContentLoaded", checkSignupSuccess);
        }
