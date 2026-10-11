// 友情链接数据配置
// 用于管理友情链接页面的数据

export interface FriendItem {
	id: number;
	title: string;
	imgurl: string;
	desc: string;
	siteurl: string;
	tags: string[];
}

// 友情链接数据
export const friendsData: FriendItem[] = [
	{
		id: 1,
		title: "Astro",
		imgurl: "https://avatars.githubusercontent.com/u/44914786?v=4&s=640",
		desc: "面向内容驱动型网站的网络框架",
		siteurl: "https://github.com/withastro/astro",
		tags: ["框架"],
	},
	{
		id: 2,
		title: "Mizuki Docs",
		imgurl:
			"https://q.qlogo.cn/headimg_dl?dst_uin=3231515355&spec=640&img_type=jpg",
		desc: "Mizuki 用户手册",
		siteurl: "https://docs.mizuki.mysqil.com",
		tags: ["文档"],
	},
	{
		id: 3,
		title: "Vercel",
		imgurl: "https://avatars.githubusercontent.com/u/14985020?v=4&s=640",
		desc: "开发。预览。部署。",
		siteurl: "https://vercel.com",
		tags: ["托管", "云服务"],
	},
	{
		id: 4,
		title: "Tailwind CSS",
		imgurl: "https://avatars.githubusercontent.com/u/67109815?v=4&s=640",
		desc: "以实用工具优先的 CSS 框架，可快速构建自定义设计",
		siteurl: "https://tailwindcss.com",
		tags: ["CSS", "框架"],
	},
	{
		id: 5,
		title: "TypeScript",
		imgurl: "https://avatars.githubusercontent.com/u/6154722?v=4&s=640",
		desc: "TypeScript 是带类型语法的 JavaScript",
		siteurl: "https://www.typescriptlang.org",
		tags: ["语言", "JavaScript"],
	},
	{
		id: 6,
		title: "React",
		imgurl: "https://avatars.githubusercontent.com/u/6412038?v=4&s=640",
		desc: "用于构建用户界面的 JavaScript 库",
		siteurl: "https://reactjs.org",
		tags: ["框架", "JavaScript"],
	},
	{
		id: 7,
		title: "GitHub",
		imgurl: "https://avatars.githubusercontent.com/u/9919?v=4&s=640",
		desc: "全世界开发者构建软件的地方",
		siteurl: "https://github.com",
		tags: ["开发", "平台"],
	},
	{
		id: 8,
		title: "MDN Web Docs",
		imgurl: "https://avatars.githubusercontent.com/u/7565578?v=4&s=640",
		desc: "面向 Web 开发者最全面的 Web 资源库",
		siteurl: "https://developer.mozilla.org",
		tags: ["文档", "参考文档"],
	},
];

// 获取所有友情链接数据
export function getFriendsList(): FriendItem[] {
	return friendsData;
}

// 获取随机排序的友情链接数据
export function getShuffledFriendsList(): FriendItem[] {
	const shuffled = [...friendsData];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
