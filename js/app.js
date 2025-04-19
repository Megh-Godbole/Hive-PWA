// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').then(() => console.log("SW registered"));
}

$(document).ready(function () {
  // Auth handlers
  $("#login-btn").on("click", function (e) {
    e.preventDefault();
    const email = $("#login-email").val();
    const password = $("#login-password").val();

    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        $("#login-email").val("")
        $("#login-password").val("")
        showApp();
      })
      .catch((error) => {
        alert("Login Error: " + error.code);
      });
  });

  $("#signup-btn").on("click", function (e) {
    e.preventDefault();
    const email = $("#signup-email").val();
    const password = $("#signup-password").val();

    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        alert("Signup successful! You can now log in.");
        $("#signup-email").val("");
        $("#signup-password").val("");
      })
      .catch((error) => {
        alert("Signup Error: " + error.code);
        console.log(error)
      });
  });

  $("#logout-btn").on("click", function () {
    firebase.auth().signOut().then(() => {
      $("#app-content").empty();
      showLogin();
    });
  });

  // Firebase auth listener
  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      showLogin();
    }
  });

  function showApp() {
    $("#auth-section").hide();
    $("#main-app").show();

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        localStorage.setItem("userEmail", user.email);
        firebase.firestore().collection("users").doc(user.uid).set({
          email: user.email
        }, { merge: true });
      }
    });


    if ('Notification' in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // After login open groups page default.
    $("#app-content").load(`pages/groups.html`);

  }

  function showLogin() {
    $("#auth-section").show();
    $("#main-app").hide();
  }

  // Navigation (load partials)
  $(".nav-btn").on("click", function () {
    const page = $(this).data("page");
    $("#app-content").load(`pages/${page}.html`);
  });

  // check the orientation and alert user.
  if (screen.orientation) {
    screen.orientation.addEventListener("change", () => {
      if (screen.orientation.type.includes("landscape")) {
        alert("For best experience, rotate your device to portrait mode.");
      }
    });
  }

  // Check the battery level and handle background sync.
  if (navigator.getBattery) {
    navigator.getBattery().then(battery => {
      console.log(`Battery Level: ${battery.level * 100}%`);

      // Check if battery level is below 20%
      if (battery.level < 0.2) {
        alert("Battery is low. Hive will pause background sync.");
        localStorage.setItem('isBatteryLow', 'true');
      } else {
        localStorage.setItem('isBatteryLow', 'false');
      }

      // Add event listener for battery level change
      battery.addEventListener("levelchange", () => {
        console.log(`Battery Level changed to ${battery.level * 100}%`);
        if (battery.level < 0.2) {
          alert("Battery is low. Hive will pause background sync.");
          localStorage.setItem('isBatteryLow', 'true');
        } else {
          localStorage.setItem('isBatteryLow', 'false');
        }
      });
    });
  }

});
