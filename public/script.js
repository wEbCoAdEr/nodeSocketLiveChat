// Document ready function to ensure DOM is fully loaded
$(document).ready(() => {
  // Initialize Socket.IO
  const socket = io();

  // Prompt the user to enter their name
  const username = prompt("Enter your name");

  // Emit 'join' event with the entered username
  socket.emit("join", username);

  // Store the current username
  const currentUsername = username;

  // Process image input
  let selectedImageBase64 = "";
  const imagePreviewContainer = $(".imagePreviewContainer");
  const imagePreview = $(".imagePreview");

  // Event listener for changes in the image input
  $(document).on("change", "#imageInput", function (e) {
    // Get the selected file
    const file = e.currentTarget.files[0];

    // Display the image preview
    if (file) {
      const reader = new FileReader();

      // Read the file as a data URL (base64)
      reader.onload = function (e) {
        selectedImageBase64 = e.target.result;
        imagePreview.attr("src", selectedImageBase64);
        imagePreviewContainer.show();
      };

      reader.readAsDataURL(file);
    }
  });

  // Function to remove the selected image
  const removeImage = () => {
    $("#imageInput").val("");
    selectedImageBase64 = "";
    imagePreview.attr("src", "");
    imagePreviewContainer.hide();
  };

  // Event listener for closing the image preview
  $(document).on("click", ".closeIcon", function () {
    removeImage();
  });

  // Event handler for submitting the chat form
  $("#chatForm").submit((e) => {
    e.preventDefault();
    // Get the message from the input field
    const message = $("#messageInput").val();
    // Emit 'chat message' event with the entered message and selected image
    socket.emit("chat message", { message, image: selectedImageBase64 });
    // Clear the input field and remove the selected image
    $("#messageInput").val("");
    removeImage();
    return false;
  });

  // Event handler for user typing
  $("#messageInput").on("keyup", function () {
    // Emit 'userTyping' event when a key is pressed
    let currentMessage = $(this).val();
    socket.emit("userTyping", currentMessage);
  });

  // Container for displaying chat messages
  let messagesContainer = $("#messages");

  // Event handler for receiving chat messages
  socket.on("chat message", (data) => {
    const { username, message, image } = data;
    let selfMessageBoxClasses = "";
    let imageElement = "";

    // Check if the message is from the current user to apply special styling
    if (currentUsername === username) {
      selfMessageBoxClasses =
        "d-flex flex-column mb-4 messageBox bg-primary w80 float-right text-white";
    } else {
      selfMessageBoxClasses =
        "d-flex flex-column mb-4 messageBox bg-dark-2 w80";
    }

    // Check if the message includes an image
    if (image !== "") {
      imageElement = `<div><img src="${image}" class="messageImage mb-1"></div>`;
    }

    // Construct the HTML markup for a chat message
    const markUp = `<div class="${selfMessageBoxClasses}">
                            <div class="mb-1"><b>${username}</b></div>
                            ${imageElement}
                            <div>${message}</div>
                        </div>`;

    // Create a new element and append it to the messages container
    const newElement = $(markUp);
    messagesContainer.append(newElement);
    // Scroll to the end of the messages container
    newElement[0].scrollIntoView({ behavior: "smooth", block: "end" });
  });

  // Event handler for user joining the chat
  socket.on("joinedChat", (data) => {
    const { message } = data;
    // Display a notification for a user joining the chat
    const markUp = `<div class="alert alert-primary">${message}</div>`;
    const newElement = $(markUp);
    messagesContainer.append(newElement);
    // Scroll to the end of the messages container
    newElement[0].scrollIntoView({ behavior: "smooth", block: "end" });
  });

  // Event handler for receiving user typing notifications
  socket.on("userTyping", (data) => {
    const { username, userID, message } = data;

    // Check if the typing alert for the user already exists
    const countElem = $(`.${userID}`).length;

    // Display typing alert if it's a new user and not the current user typing
    if (countElem === 0 && username !== currentUsername) {
      // Construct typing message preview markup
      const markUp = `<div class="d-flex flex-column mb-4 messageBox bg-dark-2 w80 ${userID}">
                          <div class="mb-1"><b>${username}</b></div>
                          <div>${message}</div>
                       </div>`;

      // Create a new element and append it to the messages container
      const messagePreviewElement = $(markUp);
      messagesContainer.append(messagePreviewElement);

      // Remove the typing alert after a delay
      messagePreviewElement.delay(200).queue(function (next) {
        $(this).remove();
        next();
      });
    }
  });

  // Event handler for user leaving the chat
  socket.on("leftChat", (data) => {
    const { message } = data;
    // Display a notification for a user leaving the chat
    const markUp = `<div class="alert alert-danger">${message}</div>`;
    const newElement = $(markUp);
    messagesContainer.append(newElement);
    // Scroll to the end of the messages container
    newElement[0].scrollIntoView({ behavior: "smooth", block: "end" });
  });

  // Event handler for reloading the chat
  socket.on("reloadChat", (data) => {
    const { status, message } = data;
    // Reload the chat page if required
    window.location.href = "index.html";
  });
});
