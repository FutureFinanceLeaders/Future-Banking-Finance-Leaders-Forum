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

    // Get form values
    const name = document.getElementById("name")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;
    const membership = document.getElementById("membership")?.value;
    const linkedin = document.getElementById("linkedin")?.value || null;
    const referral = document.getElementById("referral")?.value.trim() || null;

    const errorEl = document.getElementById("signupError");
    const successEl = document.getElementById("signupSuccess");

    // Hide messages initially
    if (errorEl) errorEl.style.display = "none";
    if (successEl) successEl.style.display = "none";

    // Validation
    if (!name || !email || !password) {
      if (errorEl) {
        errorEl.textContent = "All required fields must be filled.";
        errorEl.style.display = "block";
      }
      isSigningUp = false;
      return;
    }

    if (password.length < 6) {
      if (errorEl) {
        errorEl.textContent = "Password must be at least 6 characters.";
        errorEl.style.display = "block";
      }
      isSigningUp = false;
      return;
    }

    const termsCheckbox = document.getElementById("terms");
    if (termsCheckbox && !termsCheckbox.checked) {
      if (errorEl) {
        errorEl.textContent = "Please agree to the Terms of Service.";
        errorEl.style.display = "block";
      }
      isSigningUp = false;
      return;
    }

    try {
      const submitBtn = document.getElementById("signupBtn");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Creating Account...";
      }

      // Create user in Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // Send email verification
      await sendEmailVerification(user);

      // Generate referral code
      const referralCode = "FFL" + user.uid.slice(0, 6).toUpperCase();

      // Save user profile to database (with error handling)
      try {
        await set(ref(db, `users/${user.uid}`), {
          profile: {
            name: name,
            email: email,
            membership: membership || "free",
            linkedin: linkedin,
            createdAt: Date.now(),
            emailVerified: false,
            lastLogin: null
          },
          membership: {
            level: membership === "premium" ? "Premium" : "Free",
            status: "active",
            joinedAt: Date.now()
          },
          referral: {
            code: referralCode,
            referredBy: referral
          },
          activity: {
            eventsAttended: 0,
            downloads: 0
          }
        });

        // Welcome notification
        await push(ref(db, `notifications/${user.uid}`), {
          message: "🎉 Welcome to Future Finance Leaders (FFL)! Please verify your email before logging in.",
          read: false,
          time: Date.now(),
          type: "welcome"
        });

        // Track referral
        if (referral) {
          await push(ref(db, `referralTracking`), {
            referrerCode: referral,
            referredUserId: user.uid,
            timestamp: Date.now()
          });
        }
      } catch (dbError) {
        console.warn("Database save failed but user was created:", dbError);
        // Continue even if database save fails - user still exists in Auth
      }

      // Sign out after signup (so they must verify email before logging in)
      await signOut(auth);
      isSigningUp = false;

      // Show success message
      if (successEl) {
        successEl.innerHTML = "<strong>✓ Account Created Successfully!</strong><br>Please check your email to verify your account, then login.";
        successEl.style.display = "block";
      }

      // Clear form
      signupForm.reset();

      // Enable button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Create Account & Continue to Login";
      }

      // Redirect to login after 4 seconds
      setTimeout(() => {
        window.location.href = "login.html?signup=success&email=" + encodeURIComponent(email);
      }, 4000);

    } catch (err) {
      isSigningUp = false;

      const submitBtn = document.getElementById("signupBtn");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Create Account & Continue to Login";
      }

      if (errorEl) {
        let errorMessage = err.message;

        if (err.code === "auth/email-already-in-use") {
          errorMessage = "This email is already registered. Please login instead.";
        } else if (err.code === "auth/invalid-email") {
          errorMessage = "Invalid email address.";
        } else if (err.code === "auth/weak-password") {
          errorMessage = "Password is too weak. Please use at least 6 characters.";
        } else if (err.code === "auth/network-request-failed") {
          errorMessage = "Network error. Please check your internet connection.";
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

    if (errorEl) errorEl.style.display = "none";
    if (successEl) successEl.style.display = "none";

    if (!email || !password) {
      if (errorEl) {
        errorEl.innerHTML = "<strong>✗ Error:</strong> Email and password required.";
        errorEl.style.display = "block";
      }
      return;
    }

    try {
      const submitBtn = document.getElementById("loginBtn");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Logging in...";
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        await signOut(auth);
        if (errorEl) {
          errorEl.innerHTML = "<strong>✗ Error:</strong> Please verify your email before logging in. Check your inbox for the verification link.";
          errorEl.style.display = "block";
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = "🔐 Secure Login";
        }
        return;
      }

      // Update last login
      try {
        await set(ref(db, `users/${user.uid}/profile/lastLogin`), Date.now());
      } catch (dbError) {
        console.warn("Could not update last login:", dbError);
      }

      if (successEl) {
        successEl.innerHTML = "<strong>✓ Login successful! Redirecting...</strong>";
        successEl.style.display = "block";
      }

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);

    } catch (err) {
      if (errorEl) {
        errorEl.innerHTML = "<strong>✗ Error:</strong> Invalid email or password.";
        errorEl.style.display = "block";
      }
      
      const submitBtn = document.getElementById("loginBtn");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "🔐 Secure Login";
      }
    }
  });
}

/* =======================================================
   LOGOUT
======================================================= */
window.logout = async function() {
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

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const protectedPages = ["dashboard.html", "profile.html", "settings.html"];
  const authPages = ["login.html", "register.html"];

  if (user && user.emailVerified) {
    // User is logged in and verified
    if (authPages.includes(currentPage)) {
      window.location.href = "dashboard.html";
    }
  } else if (user && !user.emailVerified) {
    // User is logged in but not verified
    if (protectedPages.includes(currentPage)) {
      alert("Please verify your email before accessing this page.");
      window.location.href = "login.html";
    }
  } else {
    // User is not logged in
    if (protectedPages.includes(currentPage)) {
      window.location.href = "login.html?redirect=" + currentPage;
    }
  }
});

/* =======================================================
   CHECK SIGNUP SUCCESS ON LOGIN PAGE
======================================================= */
function checkSignupSuccess() {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");
  const signup = params.get("signup");

  if (signup === "success" && email) {
    const emailInput = document.getElementById("loginEmail");
    if (emailInput) {
      emailInput.value = decodeURIComponent(email);
    }
    
    const successEl = document.getElementById("loginSuccess");
    if (successEl) {
      successEl.innerHTML = "<strong>✓ Account created!</strong> Please check your email to verify your account before logging in.";
      successEl.style.display = "block";
    }
  }
  
  if (params.get("logout") === "success") {
    const successEl = document.getElementById("loginSuccess");
    if (successEl) {
      successEl.innerHTML = "<strong>✓ Logged out successfully.</strong>";
      successEl.style.display = "block";
    }
  }
}

// Run on login page
if (window.location.pathname.includes("login.html")) {
  document.addEventListener("DOMContentLoaded", checkSignupSuccess);
}