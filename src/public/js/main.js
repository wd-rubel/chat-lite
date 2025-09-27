const App = {
  currentUserId: document.querySelector('input[name="currentUserId"]')
    ? document.querySelector('input[name="currentUserId"]').value
    : 0,
  inboxContainer: document.querySelector("#chat-app"),
  addConversationModal: document.querySelector("#add-conversation-modal"),
  participant: null,
  registrationForm: document.querySelector("#add-user-form"),
  updateForm: document.querySelector("#update-user-form"),
  chatForm: document.querySelector("#chat-form"),
  messageContainer: document.querySelector("#chat-message-list"),
  firstConversation: document.querySelector("#conversation-list .conversation"),
  socket: null,

  // ---------------- SweetAlert Helpers ----------------
  showSuccess(message) {
    Swal.fire({
      icon: "success",
      title: message,
      showConfirmButton: false,
      timer: 1500,
    });
  },

  showError(message) {
    Swal.fire({ icon: "error", title: "Oops...", text: message });
  },
  bindOffCanvasEvents() {
    if(!document
      .querySelector("header .overlay")) return;
    document
      .querySelector("header .overlay")
      .addEventListener("click", function () {
        document.querySelector("header #menu-toggle").checked = false;
      });
  },
  // ---------------- Form Toggles ----------------
  bindAuthToggles() {
    const signupBtn = document.getElementById("show-signup-form");
    const loginBtn = document.getElementById("show-login-form");
    if (!signupBtn || !loginBtn) return;

    signupBtn.onclick = (e) => {
      e.preventDefault();
      document.getElementById("login-form-container").classList.add("hidden");
      document
        .getElementById("signup-form-container")
        .classList.remove("hidden");
    };

    loginBtn.onclick = (e) => {
      e.preventDefault();
      document.getElementById("signup-form-container").classList.add("hidden");
      document
        .getElementById("login-form-container")
        .classList.remove("hidden");
    };
  },

  // ---------------- Registration ----------------
  bindRegistration() {
    if (!this.registrationForm) return;
    this.registrationForm.onsubmit = async (e) => {
      e.preventDefault();
      this.clearErrors();

      const formData = new FormData(this.registrationForm);

      try {
        const res = await fetch("/users", { method: "POST", body: formData });
        const data = await res.json();

        if (data.errors) {
          this.displayErrors(data.errors);
        } else {
          this.showSuccess("User created successfully!");
          setTimeout(() => window.location.reload(), 2000);
        }
      } catch (err) {
        console.error(err);
      }
    };
  },

  // ---------------- Update Profile ----------------
  bindUpdateProfile() {
    if (!this.updateForm) return;

    // Trigger avatar input
    const avatarTrigger = this.updateForm.querySelector(
      ".change-profile-avatar"
    );
    const avatarInput = this.updateForm.querySelector('input[name="avatar"]');
    avatarTrigger?.addEventListener("click", () => avatarInput.click());

    avatarInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.updateForm.querySelector(".profile-avatar img").src =
          URL.createObjectURL(file);
      }
    };

    this.updateForm.onsubmit = async (e) => {
      e.preventDefault();
      this.clearErrors();

      const formData = new FormData(this.updateForm);

      try {
        const res = await fetch("/profile", { method: "PUT", body: formData });
        const data = await res.json();

        if (data.errors) {
          this.displayErrors(data.errors);
        } else {
          this.showSuccess("Profile updated successfully!");
          console.log("data", data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
  },

  // ---------------- Delete Profile ----------------
  bindDeleteProfile() {
    const deleteBtn = document.querySelector(
      "#profile-edit-section #delete-profile"
    );
    if (!deleteBtn) return;

    deleteBtn.addEventListener("click", async () => {
      const result = await Swal.fire({
        title: "Do you want to delete your profile permanently?",
        showDenyButton: true,
        confirmButtonText: "Yes, delete it!",
        denyButtonText: "No, keep it",
      });

      if (result.isConfirmed) {
        try {
          const res = await fetch(`/users/delete-profile`, {
            method: "DELETE",
          });
          const data = await res.json();

          if (data.errors) this.showError(data.errors.common.msg);
          else {
            this.showSuccess(data.message);
            location.replace("/");
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  },

  // ---------------- Chat Utilities ----------------
  detectMessageType(text) {
    const urlPattern = /((https?:\/\/)?[a-zA-Z0-9\-]+\.[a-z]{2,}(\S*)?)/i;
    return urlPattern.test(text) ? "url" : "text";
  },

  clearErrors() {
    document.querySelectorAll(".error").forEach((el) => {
      el.innerText = "";
      el.style.display = "none";
    });
  },

  displayErrors(errors) {
    Object.keys(errors).forEach((key) => {
      const placeholder = document.querySelector(`.${key}-error`);
      if (placeholder) {
        placeholder.innerText = errors[key].msg;
        placeholder.style.display = "block";
      }
    });
  },

  backToConversationList() {
    document.querySelector(".chat-col-left").classList.remove("chat-opened");
    document.querySelector(".chat-col-right").classList.add("hide");
  },

  async openChat(conversationId, conversationName) {
    document.querySelector(".chat-col-left").classList.add("chat-opened");
    document.querySelector(".chat-col-right").classList.remove("hide");
    document.querySelector("#chat-head").classList.add("chat-active");

    document
      .querySelectorAll("#conversation-list .conversation")
      .forEach((el) => el.classList.remove("active"));

    document
      .querySelector(
        "#conversation-list .conversation[data-id='" + conversationId + "']"
      )
      .classList.add("active");

    document.querySelector("#chat-title span").innerText = conversationName;

    try {
      const res = await fetch(`/inbox/messages/${conversationId}`);
      const data = await res.json();

      if (data.errors) return this.showError(data.errors.common.msg);

      this.participant = data.participants.find(
        (p) => p.id !== this.currentUserId
      );

      [
        "conversationId",
        "receiverId",
        "receiverName",
        "receiverAvatar",
      ].forEach((key) => {
        this.chatForm.querySelector(`input[name="${key}"]`).value =
          key === "conversationId"
            ? conversationId
            : this.participant[key.replace("receiver", "").toLowerCase()];
      });

      this.renderMessages(data.messages);
    } catch (err) {
      console.error(err);
      this.showError("Failed to load messages");
    }
  },

  renderMessages(messages) {
    this.messageContainer.innerHTML = "";

    if (!messages.length) {
      this.messageContainer.innerHTML =
        "<p class='no-messages'>No messages in this conversation.</p>";
      return;
    }

    messages.forEach((message) => {
      const isYou = message.sender.id === this.currentUserId;
      const showAvatar = !isYou;
      const attachments = message.attachments || [];
      const fileRows = attachments
        .map(
          (file) => `
        <div class="attachments-row">
          <div class="attachment-content">
            <img src="./uploads/attachments/${file}" alt="${file}" />
            <div class="attachment-name">${file}</div>
          </div>
        </div>`
        )
        .join("");

      const messageRow = document.createElement("div");
      messageRow.classList.add(
        "message-row",
        isYou ? "you-message" : "other-message"
      );

      messageRow.innerHTML = `
        <div class="message-content">
          ${
            showAvatar
              ? `<img src="./uploads/avatars/${message.sender.avatar}" alt="${message.sender.name}" class="avatar" />`
              : ""
          }
          ${fileRows}
          <div class="message-text">${
            this.detectMessageType(message.content) === "url"
              ? `<a href="${message.content}" target="_blank">${message.content}</a>`
              : message.content
          }</div>
          <div class="message-time">${new Date(
            message.createdAt
          ).toLocaleString()}</div>
        </div>
      `;
      this.messageContainer.appendChild(messageRow);
    });

    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    this.chatForm.querySelector("input.text-content").value = "";
  },

  // ---------------- Attachments ----------------
  deleteAttachment(fileName) {
    const attachmentsInput = this.chatForm.querySelector(
      'input[name="attachments"]'
    );
    const dataTransfer = new DataTransfer();

    Array.from(attachmentsInput.files).forEach((file) => {
      if (file.name !== fileName) dataTransfer.items.add(file);
    });
    attachmentsInput.files = dataTransfer.files;

    document.querySelectorAll("#attachments-placeholder li").forEach((li) => {
      if (li.querySelector(".attachment-name").innerText === fileName)
        li.remove();
    });
  },

  bindAttachmentInput() {
    if (!this.chatForm) return;

    this.chatForm.querySelector('input[name="attachments"]').onchange = (e) => {
      const files = Array.from(e.target.files);
      const list = document.createElement("ul");

      files.forEach((file) => {
        const listItem = document.createElement("li");

        const preview = file.type.startsWith("image/")
          ? `<img src="${URL.createObjectURL(file)}" alt="${file.name}"/>`
          : "";

        const deleteIcon = document.createElement("span");
        deleteIcon.classList.add("close-icon");
        deleteIcon.setAttribute("data-filename", file.name);
        deleteIcon.innerText = "+";

        listItem.innerHTML = `
          ${deleteIcon.outerHTML}
          ${preview}
          <div class="attachment-name">${file.name}</div>
        `;
        list.appendChild(listItem);
      });

      const placeholder = document.querySelector("#attachments-placeholder");
      placeholder.innerHTML = "";
      placeholder.appendChild(list);
      // remove attachments
      this.inboxContainer
        .querySelectorAll("#attachments-placeholder ul li")
        .forEach((item) => {
          const removeBtn = item.querySelector(".close-icon");
          const fileName = removeBtn.dataset.filename;
          removeBtn.addEventListener("click", () => {
            App.deleteAttachment(fileName);
            item.remove();
          });
        });
    };
  },

  // ---------------- Chat Form ----------------
  bindChatForm() {
    if (!this.chatForm) return;

    this.chatForm.onsubmit = async (e) => {
      e.preventDefault();
      document.querySelector("p.no-messages")?.remove();

      const messageText = this.chatForm
        .querySelector("input.text-content")
        .value.trim();
      const attachmentsInput = this.chatForm.querySelector("input[type=file]");
      const files = Array.from(attachmentsInput.files);

      if (!messageText && files.length === 0) return;
      if (files.length > 3)
        return this.showError("You can upload maximum 3 files at a time.");

      const fileRows = files
        .map(
          (file) => `
          <div class="attachments-row">
            <div class="attachment-content">
              <img src="${URL.createObjectURL(file)}" alt="${file.name}" />
              <div class="attachment-name">${file.name}</div>
            </div>
          </div>`
        )
        .join("");

      const messageRow = document.createElement("div");
      messageRow.classList.add("message-row", "you-message");
      messageRow.innerHTML = `
        <div class="message-content">
          ${fileRows}
          <div class="message-text">${
            this.detectMessageType(messageText) === "url"
              ? `<a href="${messageText}" target="_blank">${messageText}</a>`
              : messageText
          }</div>
          <div class="message-time">${new Date().toLocaleString()}</div>
        </div>
      `;
      this.messageContainer.appendChild(messageRow);

      try {
        const formData = new FormData(this.chatForm);
        const res = await fetch("/inbox/messages", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.errors) this.showError(data.errors.common.msg);
        else {
          this.chatForm.querySelector("input.text-content").value = "";
          attachmentsInput.value = "";
        }
      } catch (err) {
        console.error(err);
        this.showError("Something went wrong!");
      }

      document.querySelector("#attachments-placeholder").innerHTML = "";
    };
  },

  // ---------------- Socket ----------------
  bindSocket() {
    if (!this.inboxContainer) return;
    this.socket = io();

    this.socket.on("connect", () => {
      console.log("Connected via Socket.io");
      let conversationId = this.chatForm.querySelector(
        "input[name=conversationId]"
      ).value;

      this.socket.emit("joinConversation", conversationId.toString());
    });
    this.socket.on("newMessage", (message) => {
      console.log("received new message!", message);

      if (message.sender.id === this.currentUserId) return;

      const attachments = message.attachments || [];
      const fileRows = attachments
        .map(
          (file) => `
          <div class="attachments-row">
            <div class="attachment-content">
              <img src="./uploads/attachments/${file}" alt="${file}" />
              <div class="attachment-name">${file}</div>
            </div>
          </div>`
        )
        .join("");

      const messageRow = document.createElement("div");
      messageRow.classList.add("message-row", "other-message");
      messageRow.innerHTML = `
          <div class="message-content">
            <img src="./uploads/avatars/${message.sender.avatar}" alt="${
        message.sender.name
      }" class="avatar"/>
            ${fileRows}
            <div class="message-text">${
              this.detectMessageType(message.content) === "url"
                ? `<a href="${message.content}" target="_blank">${message.content}</a>`
                : message.content
            }</div>
            <div class="message-time">${new Date(
              message.createdAt
            ).toLocaleString()}</div>
          </div>
        `;
      this.messageContainer.appendChild(messageRow);
      this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    });
  },

  // ---------------- Conversations ----------------
  async createConversation(participantId) {
    try {
      const res = await fetch("/inbox/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
      const data = await res.json();
      if (data.errors) {
        document.querySelector(
          "#add-conversation-form .success-status"
        ).innerText = data.errors.common.msg;
      } else window.location.href = "/inbox";
    } catch (err) {
      console.log(err.message);
    }
  },

  async deleteConversation() {
    const result = await Swal.fire({
      title: "Do you want to delete your conversation?",
      showDenyButton: true,
      confirmButtonText: "Yes, delete it!",
      denyButtonText: "No, keep it",
    });

    if (!result.isConfirmed) return;

    const conversationId = this.chatForm.querySelector(
      "input[name=conversationId]"
    ).value;

    try {
      const res = await fetch(`/inbox/conversation/${conversationId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.errors) Swal.fire(data.errors.common.msg, "", "error");
      else {
        Swal.fire(data.msg, "", "success");
        document
          .querySelector(
            `#conversation-list .conversation[data-id="${conversationId}"]`
          )
          ?.remove();
        this.messageContainer.innerHTML =
          "<p class='no-messages'>No messages in this conversation.</p>";

        if (this.firstConversation) {
          this.openChat(
            this.firstConversation.dataset.id,
            this.firstConversation.dataset.name
          );
        }
      }
    } catch (err) {
      console.error(err);
      this.showError("Something went wrong!");
    }
  },
  bindExternalConverstationEvents() {
    document.querySelectorAll(".add-to-conversation")?.forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.createConversation(e.currentTarget.dataset.id);
      })
    );
  },

  // ---------------- User Search ----------------
  async searchUser(query, placeholder) {
    if (!query) {
      placeholder.style.display = "none";
      return;
    }

    const res = await fetch("/users/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: query }),
    });
    const data = await res.json();

    placeholder.innerHTML = "";

    if (data.length) {
      data.forEach((user) => {
        const avatar = user.avatar
          ? `./uploads/avatars/${user.avatar}`
          : "./images/user1.png";
        const li = document.createElement("li");
        li.innerHTML = `
          <div class="user-info" data-id="${user._id}" data-name="${user.name}" data-avatar="${user.avatar}">
            <img src="${avatar}" alt="${user.name}" />
            <span>${user.name}</span>
          </div>`;
        placeholder.appendChild(li);
      });
    } else placeholder.innerHTML = "<li><p>No user found</p></li>";

    placeholder.style.display = "block";
  },
  setupSearchField({
    searchInput,
    placeholder,
    onSearch,
    onSelect,
    typingDelay = 500,
  }) {
    if (!searchInput || !placeholder) return;

    let typingTimer;

    // Keyup event for typing
    searchInput.addEventListener("keyup", () => {
      placeholder.style.display = "none"; // hide placeholder while typing
      clearTimeout(typingTimer);

      if (searchInput.value) {
        typingTimer = setTimeout(() => {
          onSearch(searchInput.value, placeholder);
          placeholder.style.display = "flex";
        }, typingDelay);
      }
    });

    // Clear timer on keydown to reset typing delay
    searchInput.addEventListener("keydown", () => clearTimeout(typingTimer));

    // Click on a search result item
    placeholder.addEventListener("click", (e) => {
      const item = e.target.closest(".user-info");
      if (item) onSelect(item.dataset.id);
    });

    // Click outside to close
    document.addEventListener("click", (e) => {
      if (!searchInput.contains(e.target) && !placeholder.contains(e.target)) {
        
        if(placeholder.classList.contains('user-search-results-sidebar')) {
          placeholder.style.display = "none";
          searchInput.value = '';
        }
        
      }
    });
  },
  bindUserSearch() {
    const searchInput = document.querySelector("#add-conversation-form .user");
    const placeholder = document.querySelector(
      "#add-conversation-modal .user-search-results"
    );

    const searchInputTwo = document.querySelector(
      ".chat-col-left #search-container input"
    );
    const placeholderTwo = document.querySelector(
      ".chat-col-left #search-container .user-search-results"
    );
    this.setupSearchField({
      searchInput,
      placeholder,
      onSearch: (query, placeholderElem) => {
        // your existing searchUser function
        this.searchUser(query, placeholderElem);
      },
      onSelect: (userId) => {
        // your existing createConversation function
        this.createConversation(userId);
      },
    });
    this.setupSearchField({
      searchInput: searchInputTwo, // must be 'searchInput'
      placeholder: placeholderTwo, // must be 'placeholder'
      onSearch: (query, placeholderElem) => {
        // your existing searchUser function
        this.searchUser(query, placeholderElem);
      },
      onSelect: (userId) => {
        // your existing createConversation function
        this.createConversation(userId);
      },
    });
  },

  openAddConversationModal() {
    this.addConversationModal.style.display = "block";
  },

  closeAddConversationModal() {
    this.addConversationModal.style.display = "none";
  },

  // ---------------- Inbox ----------------
  bindInboxEvents() {
    if (!this.inboxContainer) return;

    if (this.firstConversation) {
      this.openChat(
        this.firstConversation.dataset.id,
        this.firstConversation.dataset.name
      );
    }

    this.inboxContainer
      .querySelector("#chat-head .delete-btn")
      .addEventListener("click", () => this.deleteConversation());
    this.inboxContainer
      .querySelector("#add-user-conversation")
      .addEventListener("click", () => this.openAddConversationModal());
    this.addConversationModal
      .querySelector(".modal-close")
      .addEventListener("click", () => this.closeAddConversationModal());

    this.inboxContainer
      .querySelectorAll("#conversation-list .conversation")
      .forEach((conversation) =>
        conversation.addEventListener("click", () => {
          this.openChat(conversation.dataset.id, conversation.dataset.name);
        })
      );

    this.inboxContainer
      .querySelector(".back-btn")
      .addEventListener("click", App.backToConversationList);

    this.inboxContainer
      .querySelector(".add-attachment")
      .addEventListener("click", function () {
        App.chatForm.querySelector(`input[name="attachments`).click();
      });
  },

  // ---------------- Init ----------------
  init() {
    this.bindAuthToggles();
    this.bindRegistration();
    this.bindUpdateProfile();
    this.bindDeleteProfile();
    this.bindAttachmentInput();
    this.bindChatForm();
    this.bindSocket();
    this.bindUserSearch();
    this.bindInboxEvents();
    this.bindExternalConverstationEvents();
    this.bindOffCanvasEvents();
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
