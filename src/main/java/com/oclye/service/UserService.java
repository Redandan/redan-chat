package com.oclye.service;

import com.alibaba.fastjson.JSONObject;
import com.oclye.config.WebSocketConfig;
import com.oclye.model.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * @author ocly
 * @date 2018/2/3 17:18
 */
@Service
public class UserService implements UserDetailsService {

	@Autowired
	WebSocketConfig webSocketConfig;

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		String onlinuser = webSocketConfig.users.toString();
		JSONObject parseObject = JSONObject.parseObject(onlinuser);
		System.out.println("parseObject---" + parseObject.toString());

		for (Map.Entry<String, Object> entry : parseObject.entrySet()) {
			if (username.equals(entry.getValue()) || "阳仔".equals(username)) {
				throw new UsernameNotFoundException("用户已存在");
			}
		}
		if (onlinuser.contains(username) || "admin".equals(username)) {
			System.out.println(username);
			List<GrantedAuthority> authorities = new ArrayList<>();
			authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
			UserPrincipal user = new UserPrincipal(username, "123", authorities);
			user.setName(username);
			return user;
		}
		
		List<GrantedAuthority> authorities = new ArrayList<>();
		authorities.add(new SimpleGrantedAuthority("USER"));
		UserPrincipal user = new UserPrincipal(username, "", authorities);
		user.setName(username);
		return user;
	}

}
