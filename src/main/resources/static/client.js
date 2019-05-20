/**
 * Created by Administrator on 2018/2/2.
 */
var stompClient = null;
var sessionId = null;
function setConnected(connected) {
	$("#connect").html('连接');
	if (connected) {
		$("#connect").html('成功');
	}
	$("#connect").prop("disabled", connected);
	$("#disconnect").prop("disabled", !connected);
	$("#send").prop("disabled", !connected);
	$("#sendtouser").prop("disabled", !connected);
	$("#username").prop("disabled", connected);

}
//请求连接
function login() {
	var name = $("#username").val().trim();
	if (name === '') {
		$("#username").val('用户名不能为空');
		return;
	}

	$.ajax({
		type: "POST",
		url: "/login",
		data: {username: name},
		success: function () {
			connect();
		},
		error: function () {
			$("#username").val('重名了');
		}
	});
}

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

//断开连接
function disconnect() {
	if (stompClient !== null) {
		stompClient.disconnect();
	}
	//removeUser(sessionId);
	setConnected(false);
	console.log("Disconnected");
}

function sendName() {
	var content = $("#content").val();
	if (content.trim() === '') {
		return;
	}
	stompClient.send("/app/hello", {}, JSON.stringify({'name': $("#username").val(), 'content': content}));
	$("#content").val('');
}
//发送信息
function sendToUser() {
	var touser = $("#privateuser").html();
	var patt1 = new RegExp(/【(.*?)】/g);
	var tousername = patt1.exec($("#privateuser").html())[1];
	var content = $("#contentuser").val();
	if (content.trim() === '') {
		return;
	}
	if (touser.trim() !== '咨询窗口') {
		stompClient.send("/app/private", {}, JSON.stringify({'name': $("#username").val(), 'content': content, 'receiver': tousername}));
		$("#contentuser").val('');
	}
}
//机器人服务
function touser(message) {
	$("#" + message.id + " span").html('');
	if ($("#privateuser").html() === '咨询窗口') {
		$("#privateuser").html("咨询窗口 与 【" + message.textContent + "】");
		$(".msg-" + message.textContent).prop("hidden", false);
		return;
	}
	var patt1 = new RegExp(/【(.*?)】/g);
	var tousername = patt1.exec($("#privateuser").html())[1];
	if (message.class === tousername) {
		return;
	}
	$(".msg-" + tousername).prop("hidden", true);
	$("#privateuser").html("咨询窗口 与 【" + message.textContent + "】");
	$(".msg-" + message.textContent).prop("hidden", false);
}

function hidetlobby() {
	if ($("#lobby").is(":hidden")) {
		$("#lobby").show();
		$("#conversation +div").show();
	} else {
		$("#lobby").hide();
		$("#conversation +div").hide();
	}
}
//拉起和放下咨询窗口
function hidetprivate() {
	if ($("#private").is(":hidden")) {
		$("#private").show();
		$("#privatechat +div").show();
	} else {
		$("#private").hide();
		$("#privatechat +div").hide();
	}
}
//拉起和放下在线客服
function hidetuser() {
	if ($("#user").is(":hidden")) {
		$("#user").show();
	} else {
		$("#user").hide();
	}
}
function showGreeting(message) {
	$("#lobby").append("<tr><td>" + message + "</td></tr>");
	var div = document.getElementById('lobby');
	div.scrollTop = div.scrollHeight;
}
function showMessage(message, touser) {
	var patt1 = new RegExp(/【(.*?)】/g);
	var tousername = '';
	if ($("#privateuser").html() !== '咨询窗口') {
		tousername = patt1.exec($("#privateuser").html())[1];
	}
	if (touser === $("#username").val()) {
		$("#private").append("<tr class='msg-" + touser + "'><td>" + message + "</td></tr>");
	}
	if (touser === tousername) {
		$("#private").append("<tr class='msg-" + touser + "'><td>" + message + "</td></tr>");
	} else {
		var i = $("." + touser + " span").html();
		if (i === '') {
			i = 0;
		}
		$("." + touser + " span").html(++i);
		$("#private").append("<tr class='msg-" + touser + "' hidden><td>" + message + "</td></tr>");
	}

	var div = document.getElementById('private');
	div.scrollTop = div.scrollHeight;
}
function showUser(user, id) {
	$("#user").append("<tr id='" + id + "' onclick='javascript:touser(this)' class='" + user + "'><td>" + user + "<span class='badge pull-right'></span></td></tr>");
}
function removeUser(id) {
	$("tr").remove("#" + id);
}

$(function () {
	$.ajax({
		type: "GET",
		url: "/userlist",
		dataType: "json",
		success: function (json) {
			for (var p in json) {//遍历json对象的每个key/value对,p为key
				showUser(json[p], p);
			}
		}
	});
	//表单提交拦截
	$("form").on('submit', function (e) {
		e.preventDefault();
	});
	//请求连接
	$("#connect").click(function () {
		login();
	});
	//断开连接
	$("#disconnect").click(function () {
		disconnect();
	});
	$("#send").click(function () {
		sendName();
	});
	//发送信息
	$("#sendtouser").click(function () {
		sendToUser();
	});
});
$(document).ready(function () {
	var div = document.getElementById('lobby');
	div.scrollTop = div.scrollHeight;
});
