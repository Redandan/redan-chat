'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');

var stompClient = null;
var username = null;

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];


//请求连接
function connect() {
	var socket = new SockJS('/gs-guide-websocket');
	stompClient = Stomp.over(socket);
	stompClient.connect({}, function (frame) {
		setConnected(true);
		sessionId = /\/([^\/]+)\/websocket/.exec(socket._transport.url)[1];
		// showUser($("#username").val(), sessionId);
		stompClient.subscribe('/topic/greetings', function (greeting) {
			showGreeting(JSON.parse(greeting.body).content);
		});
		stompClient.subscribe('/user/topic/private', function (greeting) {
			var parse = JSON.parse(greeting.body);
			showMessage(parse.content, parse.name);
		});
		stompClient.subscribe('/topic/userlist', function (greeting) {
			var parse = JSON.parse(greeting.body);
			if (parse.online) {
				showUser(parse.name, parse.id);
			} else {
				removeUser(parse.id);
			}
		});
	});
}

function connect(event) {
    username = document.querySelector('#name').value.trim();

    if(username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        $.ajax({
    		type: "POST",
    		url: "/login",
    		data: {username: username},
    		success: function () {
    			 var socket = new SockJS('/gs-guide-websocket');
    		        stompClient = Stomp.over(socket);

    		        stompClient.connect({}, onConnected, onError);
    		},
    		error: function () {
    			alert('重名了');
    		}
    	});
        
        
       
    }
    event.preventDefault();
}


function onConnected() {
	
	/*
	stompClient.subscribe('/user/topic/private', function (greeting) {
			var parse = JSON.parse(greeting.body);
			showMessage(parse.content, parse.name);
		}); 
	 */	
	
    // Subscribe to the Public Topic
//    stompClient.subscribe('/topic/public', onMessageReceived);
    stompClient.subscribe('/user/topic/private', onMessageReceived);

    // Tell your username to the server
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    )

    connectingElement.classList.add('hidden');
}


function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}


function sendMessage(event) {
    var messageContent = messageInput.value.trim();

    if(messageContent && stompClient) {
        stompClient.send("/app/private", {}, JSON.stringify(
        		{'name': username, 'content': messageInput.value, 'receiver': '\u5ba2\u670d\u5c0f\u59d0'}));
    	
        messageInput.value = '';
    }
    event.preventDefault();
}


function onMessageReceived(payload) {
	
    var message = JSON.parse(payload.body);
    var messageElement = document.createElement('li');
    
    if(message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.name + ' joined!';
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.name + ' left!';
    } else {
        messageElement.classList.add('chat-message');
        console.log(message);
        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.name);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.name);

        messageElement.appendChild(avatarElement);

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.name);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    }

    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}


function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }

    var index = Math.abs(hash % colors.length);
    return colors[index];
}

usernameForm.addEventListener('submit', connect, true)
messageForm.addEventListener('submit', sendMessage, true)
