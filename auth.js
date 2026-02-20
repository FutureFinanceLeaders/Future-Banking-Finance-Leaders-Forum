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

// SIGN UP
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    console.log("Form submitted"); // Check if this appears
    
    const name = document.getElementById("name")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;
    const membership = document.getElementById("membership")?.value;
    const linkedin = document.getElementById("linkedin")?.value || null;
    const referral = document.getElementById("referral")?.value.trim() || null;
    
    const errorEl = document.getElementById("signupError");
    const successEl = document.getElementById("signupSuccess");
    
    errorEl.style.display = "none";
    successEl.style.display = "none";
    
    console.log("Form data:", { name, email, membership }); // Check this
    
    try {
      // JUST TEST AUTHENTICATION FIRST (skip database)
      console.log("Creating user...");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User created successfully:", cred.user.uid);
      
      // If we get here, authentication works!
      successEl.innerHTML = "✓ Account created! You can now login.";
      successEl.style.display = "block";
      
      // Clear form
      signupForm.reset();
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = "login.html";
      }, 3000);
      
    } catch (err) {
      console.error("Signup error:", err); // This will show the actual error
      
      errorEl.innerHTML = `<strong>Error:</strong> ${err.message}`;
      errorEl.style.display = "block";
    }
  });
}