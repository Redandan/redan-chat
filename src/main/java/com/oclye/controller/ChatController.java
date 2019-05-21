package com.oclye.controller;

import com.alibaba.fastjson.JSONObject;
import com.oclye.config.WebSocketConfig;
import com.oclye.model.ChatMessage;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * @author ocly
 * @date 2018/2/2 15:42
 */
@RestController
public class ChatController {

	private SimpleDateFormat simpleDateFormat = new SimpleDateFormat("MM-dd HH:mm");

	@Autowired
	private SimpMessagingTemplate template;

	@Autowired
	WebSocketConfig webSocketConfig;

	@GetMapping("/userlist")
	public JSONObject getUserlist() {
		JSONObject users = webSocketConfig.users;
		return users;
	}

	/**
	 *
	 * @param message
	 * @return
	 * @throws Exception
	 */
	@MessageMapping("/hello")
	@SendTo("/topic/greetings")
	public ChatMessage greeting(ChatMessage message) throws Exception {
		String date = simpleDateFormat.format(new Date());
		String content = date + "【" + message.getName() + "】說：" + message.getContent();
		message.setDate(date);
		message.setContent(content);
		Thread.sleep(1000);
		return message;
	}

	/**
	 *
	 *
	 * @param message
	 * @throws Exception
	 */
	@MessageMapping("/private")
	public void privatechat(ChatMessage message) throws Exception {
		System.out.println(message);
		String ctx = message.getContent();
		String userid = message.getName();
		String touser = message.getReceiver();

		String date = simpleDateFormat.format(new Date());
		String content = date + "【" + userid + "】對您說：" + ctx;
		String contents = date + " 您對【" + touser + "】說：" + ctx;

		template.convertAndSendToUser(userid, "/topic/private", new ChatMessage(touser, contents, touser, date));
		Thread.sleep(1000);
		if ("阳仔".equals(touser)) {
			touser = userid;
			String url = "http://www.tuling123.com/openapi/api";
			//请填写自己的key
			String post = "{\"key\": \"\",\"info\": \"" + ctx + "\",\"userid\":\"" + userid + "\"}";
			String body = Jsoup.connect(url).method(Connection.Method.POST)
				.requestBody(post)
				.header("Content-Type", "application/json; charset=utf-8")
				.ignoreContentType(true).execute().body();
			String text = JSONObject.parseObject(body).getString("text");
			content = date + "【阳仔】对你说：" + text;
			template.convertAndSendToUser(touser, "/topic/private", new ChatMessage("阳仔", content, "阳仔", date));
			return;
		}
		template.convertAndSendToUser(touser, "/topic/private", new ChatMessage(userid, content, userid, date));

	}
}
