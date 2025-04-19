$(document).ready(function () {
    const db = firebase.firestore();
    const currentUserEmail = firebase.auth().currentUser.email;
  
    // Fetch all users (to populate member dropdown)
    function loadUsers() {
      firebase.firestore().collection("users").get().then(snapshot => {
        snapshot.forEach(doc => {
          const email = doc.data().email;
          if (email !== currentUserEmail) {
            $("#group-members").append(`<option value="${email}">${email}</option>`);
          }
        });
      });
    }
  
    // Load user's groups
    function loadGroups() {
        const seenGroupIds = new Set(); // To track already added group IDs
        $("#group-list").empty();
      
        db.collection("groups")
          .where("members", "array-contains", currentUserEmail)
          .get()
          .then(snapshot => {
            snapshot.forEach(doc => {
              const groupId = doc.id;
              if (!seenGroupIds.has(groupId)) {
                seenGroupIds.add(groupId);
      
                const group = doc.data();
                const members = group.members.join(", ");
      
                $("#group-list").append(`
                  <li class="group-item">
                    <span>${group.name}</span>
                    <div>
                      <small>${members}</small>
                      <span class="delete-btn" data-id="${groupId}">🗑️</span>
                    </div>
                  </li>
                `);
              }
            });
          })
          .catch(error => {
            console.error("Error loading groups:", error);
          });
      }      
  
    // Delete group
    $(document).on("click", ".delete-btn", function () {
      const id = $(this).data("id");
      db.collection("groups").doc(id).delete().then(() => {
        loadGroups();
      });
    });
  
    // Modal open/close
    $("#create-group-btn").on("click", () => {
      $("#group-modal").removeClass("hidden");
      $("#group-name").val("");
      $("#group-members").empty();
      loadUsers();
    });
  
    $("#close-modal").on("click", () => {
      $("#group-modal").addClass("hidden");
    });
  
    // Create group
    $("#submit-group").on("click", () => {
      const name = $("#group-name").val();
      const members = $("#group-members").val() || [];
      members.push(currentUserEmail); // Add logged in user
  
      const uniqueMembers = [...new Set(members)];
  
      db.collection("groups").add({
        name,
        members: uniqueMembers
      }).then(() => {
        $("#group-modal").addClass("hidden");
        loadGroups();
      });
    });
  
    loadGroups(); // Load groups on page load
  });
  