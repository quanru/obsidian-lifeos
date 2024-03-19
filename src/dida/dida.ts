import dayjs from "dayjs";
import path from "path";
import { TFile, Tasks, requestUrl, moment, App } from "obsidian";
import qs from "querystring";
import debug from "debug";
import { logMessage } from "src/util";
import { LogLevel } from "src/type";
import { File } from "src/periodic/File";
export enum TaskStatus {
	UnCompleted = 0,
	Abandoned = -1,
	Completed = 2,
}
export enum ServeType {
	Dida = "dida",
	TickTick = "ticktick",
}
export type DidaConfig = {
	/**
	 * 标签
	 */
	tags?: string[] | string;
	/**
	 * 排除的标签
	 */
	excludeTags?: string[] | string;
	/**
	 * 任务
	 */
	taskId?: string;
	/**
	 * 清单名
	 */
	projectName?: string
	/**
	 * 项目Id
	 */
	projectId?: string;
	/**
	 * 要同步数据开始时间，从哪天开始，默认180天前
	 */
	fromDate?: string;
	/**
	 * 要同步数据截止时间，到哪天截止，默认今天
	 */
	toDate?: string
	/**
	 * 任务状态
	 */
	status?: TaskStatus;
	/**
	 * 服务
	 */
	type: ServeType;
};
type DiDa365APIOptions = {
	username: string;
	password: string;
	apiHost?: string;
	host?: string;
};

export interface ITaskItem {
	id: string;
	projectId: string;
	sortOrder: number;
	title: string;
	exDate: any[];
	repeatTaskId: any;
	content: string;
	repeatFrom: any;
	desc: string;
	timeZone: string;
	isFloating: boolean;
	isAllDay: boolean;
	reminder: string;
	reminders: any[];
	priority: number;
	status: number;
	items: any[];
	progress: number;
	attachments: Array<{
		createdTime: string;
		fileName: string;
		fileType: string;
		id: string;
		path: string;
		size: number;
	}>;
	dueDate?: string;
	modifiedTime: string;
	etag: string;
	deleted: number;
	createdTime: string;
	creator: number;
	focusSummaries: any[];
	completedTime: string,
	commentCount: number;
	parentId?: string
	childIds?: string[]
	columnId: string;
	kind: string;
	deletedTime: number;
	tags: string[];
	/**
	 * 处理过的
	 */
	formatedContent?: string
};
/**
 * 清单的信息
 */
interface IProjectProfile {
	/**  
	 * 清单唯一标识符  
	 */
	id: string;

	/**  
	 * 清单名字  
	 */
	name: string;

	/**  
	 * 是否为拥有者  
	 */
	isOwner: boolean;

	/**  
	 * 颜色（默认为null）  
	 */
	color?: null;

	/**  
	 * 是否在所有中  
	 */
	inAll: boolean;

	/**  
	 * 自定义排序（大负数）  
	 */
	sortOrder: number;

	/**  
	 * 排序选项（包含groupBy和orderBy字段）  
	 */
	sortOption?: {
		/**  
		 * sortType字段（可选）  
		 */
		groupBy?: string;

		/**  
		 * sortType字段（可选）  
		 */
		orderBy?: string;
	};

	/**  
	 * 排序类型  
	 */
	sortType: string;

	/**  
	 * 用户数量  
	 */
	userCount: number;

	/**  
	 * etag（可选）  
	 */
	etag?: string;

	/**  
	 * 修改时间（可选）  
	 */
	modifiedTime?: Date;

	/**  
	 * 是否关闭（可选）  
	 */
	closed?: boolean;

	/**  
	 * 是否静音（可选）  
	 */
	muted?: boolean;

	/**  
	 * 是否转移（可选）  
	 */
	transferred?: boolean;

	/**  
	 * 分组ID（可选）  
	 */
	groupId?: string;

	/**  
	 * 视图模式（如list等，可选）  
	 */
	viewMode?: string;

	/**  
	 * 通知选项（可选）  
	 */
	notificationOptions?: any;

	/**  
	 * 团队ID（可选）  
	 */
	teamId?: string;

	/**  
	 * 协同共享权限（如write等）  
	 */
	permission: string;

	/**  
	 * 种类（如TASK等）  
	 */
	kind: string;

	/**  
	 * 时间线（可选）  
	 */
	timeline?: any;

	/**  
	 * 时间线范围（可选）  
	 */
	timelineRange?: any;

	/**  
	 * 时间线排序类型（可选）  
	 */
	timelineSortType?: string;

	/**  
	 * 时间线排序选项（可选）  
	 */
	timelineSortOption?: {
		/**  
		 * 时间线排序选项的groupBy（可选）  
		 */
		groupBy?: string;

		/**  
		 * 时间线排序选项的orderBy（可选）  
		 */
		orderBy?: string;
	};

	/**  
	 * 是否需要审核（可选）  
	 */
	needAudit?: boolean;

	/**  
	 * 是否对团队开放（可选）  
	 */
	openToTeam?: boolean;

	/**  
	 * 团队成员权限（可选）  
	 */
	teamMemberPermission?: any;

	/**  
	 * 来源（可选）  
	 */
	source?: any;
}
interface IFilter {
	/**  
	 * 过滤器唯一标识符  
	 */
	id: string;

	/**  
	 * 过滤器的名称  
	 */
	name: string;

	/**  
	 * 过滤规则，JSON格式字符串  
	 */
	rule: string;

	/**  
	 * 自定义排序值  
	 */
	sortOrder: number;

	/**  
	 * 排序类型  
	 */
	sortType: string;

	/**  
	 * 视图模式，当前为null表示未设置  
	 */
	viewMode?: null;

	/**  
	 * 时间线设置，当前为null表示未设置  
	 */
	timeline?: null;

	/**  
	 * ETag值，用于缓存验证  
	 */
	etag: string;

	/**  
	 * 创建时间  
	 */
	createdTime: string;

	/**  
	 * 最后修改时间  
	 */
	modifiedTime: string;

	/**  
	 * 排序选项，包含分组和排序字段  
	 */
	sortOption: {
		/**  
		 * 分组字段  
		 */
		groupBy: string;

		/**  
		 * 排序字段  
		 */
		orderBy: string;
	};
}
interface ITag {
	/**  
	 * 标签名称  
	 */
	name: string;

	/**  
	 * 原始标签名称  
	 */
	rawName: string;

	/**  
	 * 显示标签  
	 */
	label: string;

	/**  
	 * 自定义排序值  
	 */
	sortOrder: number;

	/**  
	 * 排序类型  
	 */
	sortType: string;

	/**  
	 * 标签颜色  
	 */
	color: string;

	/**  
	 * ETag值，用于缓存验证  
	 */
	etag: string;

	/**  
	 * 父标签或分类  
	 */
	parent: string;

	/**  
	 * 标签类型  
	 */
	type: number;
}
interface ISyncTaskOrderBean {
	taskOrderByDate?: any; // 假设这个字段的具体类型未知，或者可能是多种类型，所以使用any作为占位符  
	taskOrderByPriority?: any;
	taskOrderByProject?: any;
}

interface ISyncOrderBean {
	orderByType?: any; // 同上，假设字段类型未知  
}

interface ISyncOrderBeanV3 {
	orderByType?: any; // 同上，假设字段类型未知  
}

interface IDidaAllInfo {
	checkPoint: number
	syncTaskBean: {
		update: ITaskItem[],
		delete: ITaskItem[],
		add: ITaskItem[],
		empty: boolean
	}
	projectProfiles: IProjectProfile[]
	projectGroups: any[]
	filters: IFilter[]
	tags: ITag[],
	syncTaskOrderBean?: ISyncTaskOrderBean;
	syncOrderBean?: ISyncOrderBean;
	syncOrderBeanV3?: ISyncOrderBeanV3;
	inboxId?: any; // 假设这个字段的具体类型未知  
	checks?: any; // 假设这个字段的具体类型未知  
	remindChanges?: any; // 假设这个字段的具体类型未知  
}

type IDiDa365API = {
	getItems(filterOptions?: DidaConfig): Promise<ITaskItem[]>;
};
/**
 * 账号信息
 * {
  "token": "8B0120E62ADDD9E6160214D6FCE61B60997EDE2A806FFAE59D019D379C57D0CABABE007B030151002FFD8A51141A473C07DC8B58CA6BFA85E04DA4A3577D008B9751E954783FE7921F3BAF20594B793D34375051271D0F6AF0AB23C0B",
  "userId": "1020318808",
  "userCode": "731e59d510ea4c4b863225b469a612dc",
  "username": "xxx@outlook.com",
  "teamPro": false,
  "proStartDate": "2022-11-21T01:19:08.000+0000",
  "proEndDate": "2023-02-19T04:49:43.000+0000",
  "needSubscribe": true,
  "inboxId": "inbox1020298808",
  "teamUser": false,
  "activeTeamUser": false,
  "freeTrial": false,
  "pro": false,
  "ds": false
}
 */
interface IDidaAccountInfo {
	/**
  * 账户token字符串，用于验证账户
  */
	token: string;
	/**
	 * 用户唯一ID
	 */
	userId: string;
	/**
	 * 用户代码
	 */
	userCode?: string;
	/**
	 * 账户名
	 */
	username: string;
	/**
	 * 是否是团队专业版
	 */
	teamPro?: boolean;
	/**
	 * 专业版开始日期
	 */
	proStartDate?: string;
	/**
	 * 专业版结束日期
	 */
	proEndDate?: string;
	/**
	 * 是否需要订阅
	 */
	needSubscribe?: boolean;
	/**
	 * 默认任务添加清单ID
	 */
	inboxId?: string;
	/**
	 * 是否是团队用户
	 */
	teamUser?: boolean;
	/**
	 * 是否是活跃的团队用户
	 */
	activeTeamUser?: boolean;
	/**
	 * 是否是免费试用
	 */
	freeTrial?: boolean;
	/**
	 * 是否是专业版
	 */
	pro?: boolean;
	/**
	 * 数据科学家标识
	 */
	ds?: boolean;
}
interface IDidaCacha {
	tagIdNameMap: { [key: string]: string },
	projNameIdMap: { [key: string]: string },
	projIdNameMap: { [key: string]: string },
	itemMap?: { [key: string]: ITaskItem }
}
import type PeriodicPARA from "../main"
export class DiDa365API implements IDiDa365API {
	private cookies: string[] = [];
	private cookieHeader: string;

	private expTime: number;
	private didaAccountInfo: IDidaAccountInfo;
	private readonly options: Required<DiDa365APIOptions>;
	private readonly log: (...args: any[]) => any;

	private _allInfo: IDidaAllInfo;
	private _dataCache: IDidaCacha
	plugin: PeriodicPARA;
	constructor(options: DiDa365APIOptions, plugin: PeriodicPARA) {
		this.plugin = plugin;
		this.options = {
			apiHost: "https://api.dida365.com",
			host: "https://dida365.com",
			...options,
		};
		this.log = debug("dida365:api");
	}
	public async initDidaDataCache(force?: boolean) {
		// 读取本地缓存
		this._dataCache = await this.plugin.readData<IDidaCacha>("didaCache.json");
		if (!this._dataCache) this._dataCache = { tagIdNameMap: {}, projNameIdMap: {}, projIdNameMap: {}, itemMap: undefined };
		await this.getUpdateInfo();

		let itemMap = this._dataCache.itemMap!;


		if (Object.keys(itemMap).length <= 0 || force) {
			let notInAllProjectIds = [];
			for (let projProfile of this._allInfo.projectProfiles) {
				if (!projProfile.inAll) {
					notInAllProjectIds.push(projProfile.id);
				}
			}
			let items = await this.getItems({ type: ServeType.Dida });
			for (let notInAllProjectId of notInAllProjectIds) {
				let projectItems = await this.getItems({ projectId: notInAllProjectId, type: ServeType.Dida });
				items = items.concat(projectItems);
			}
			this._dataCache.itemMap = itemMap = {};
			items.forEach((value) => {
				itemMap![value.id] = value;
			})

			for (let item of items) {

				this.formatItemInfo(item);
			}
		} else {
			let { empty, update, add } = this._allInfo.syncTaskBean;
			if (!empty) {
				for (let item of update) {
					let oldItem = itemMap[item.id];
					if (dayjs(item.modifiedTime).valueOf() > dayjs(oldItem?.modifiedTime).valueOf()) {
						// 更新了
						itemMap[item.id] = item;
						this.formatItemInfo(item);
					}

				}

				for (let item of add) {
					itemMap[item.id] = item;
					this.formatItemInfo(item);
				}

				for (let item of this._allInfo.syncTaskBean.delete) {
					if (item.kind === "NOTE") continue;
					delete itemMap[item.id];

				}
			}

		}

		await this.plugin.writeData("didaCache.json", this._dataCache);


	}
	private formatItemInfo(item: ITaskItem) {
		let formatedItem: string;
		// 处理标签
		let tagsStr = item.tags
			? item.tags.map((value) => {
				return `#${this._dataCache.tagIdNameMap[value]}`;
			}).join(" ")
			: '';

		// id
		let blockId = `^${item.id}-dida`;

		// 创建时间
		const formatedCreatedTime = ` ➕ ${moment(item.createdTime).format('YYYY-MM-DD')}`;
		// 内容文本
		let contentLines = item.content
			? item.content.split("\n")
			: undefined;
		let blockTStr = this.getTCharStr(item, '\t');
		let titleTStr = blockTStr.replace('\t', '');
		let blockContent = contentLines && contentLines.length > 0
			? contentLines
				.map((line: string) => `${blockTStr}${line}`)
				.join("\n") + "\n"
			: "";
		if (item.kind === "NOTE") {
			// 格式化笔记
			formatedItem = `- ${item.title}${formatedCreatedTime} ${tagsStr}\n`;

			formatedItem += blockContent + `\t${blockId}\n`;

		} else {
			// 格式化任务

			// 状态处理
			let statusChar = ' ';
			switch (item.status) {
				case TaskStatus.Abandoned:
					statusChar = '-';
					break;
				case TaskStatus.Completed:
					statusChar = 'x';
					break;

			}
			// 完成时间
			let formatCompletedTime = "";
			if (item.status === TaskStatus.Completed) {
				formatCompletedTime = ` ✅ ${moment(item.completedTime).format('YYYY-MM-DD')}`
			}

			// 子任务处理TODO
			if (item.childIds) {
				// 向上找父节点

				const itemMap = this._dataCache.itemMap;
				let childItem: ITaskItem;
				for (let childId of item.childIds) {
					childItem = itemMap![childId];
					if (!childItem) {
						logMessage(`缺乏任务数据:${childId}`, LogLevel.error);
						continue;
					}
					this.formatItemInfo(childItem);
					blockContent += childItem.formatedContent;
				}

			}
			// 标题
			formatedItem = `${titleTStr}- [${statusChar}] ${item.title}${formatedCreatedTime}${formatCompletedTime}  ${tagsStr}\n`;
			formatedItem += blockContent + `${blockTStr}${blockId}\n`;

		}
		item.formatedContent = formatedItem;
	}
	private getTCharStr(item: ITaskItem, tStr: string): string {
		if (item.parentId) {
			tStr += '\t';
			return this.getTCharStr(this._dataCache.itemMap![item.parentId], tStr);
		} else {
			return tStr;
		}

	}
	public async writeTasksToObsidian(force?: boolean) {
		// 

		await this.initDidaDataCache();
		let tasksFilePath = "Dida/任务.md";
		let memosFilePath = "Dida/笔记.md";
		let didaTasksFile = this.plugin.file.get(tasksFilePath);
		let didaMemosFile = this.plugin.file.get(memosFilePath);
		if (didaTasksFile instanceof TFile && didaMemosFile instanceof TFile) {
			let noteFileContent = '';
			let taskFileContent = '';
			let projectContentMap: { [key: string]: string } = {};
			let itemMap = this._dataCache.itemMap!;
			for (let id in itemMap) {
				let taskItem = itemMap[id];
				if (taskItem.kind === "NOTE") {
					noteFileContent += taskItem.formatedContent + "\n";
				} else {
					if (taskItem.parentId) continue;
					let projectId = taskItem.projectId;
					let projectContent = projectContentMap[projectId];
					if (!projectContent) {
						let projectName = '';
						if (projectId === this.didaAccountInfo.inboxId) {
							projectName = "收集箱"
						} else {
							projectName = this._dataCache.projIdNameMap[projectId];
						}
						projectContent = `## ${projectName}\n`;
					}

					projectContentMap[projectId] = projectContent + taskItem.formatedContent;

				}
			}
			for (let key in projectContentMap) {
				taskFileContent += projectContentMap[key] + "\n";
			}
			await this.plugin.app.vault.modify(didaTasksFile, taskFileContent);
			await this.plugin.app.vault.modify(didaMemosFile, noteFileContent);
		} else {
			logMessage(`没有这个文件:${tasksFilePath},${memosFilePath}`);
		}
	}
	public async getItems(filterOptions: DidaConfig) {
		this.log("getItem filterOptions", filterOptions);
		await this.checkLogin();
		if (filterOptions.projectId === "inbox") {
			// inboxId
			filterOptions.projectId = this.didaAccountInfo.inboxId;
		}
		if (filterOptions.projectName) {
			filterOptions.projectId = this._dataCache.projNameIdMap[filterOptions.projectName];
		}
		const startDateTimestamp = filterOptions?.fromDate
			? dayjs(filterOptions.fromDate).valueOf()
			: dayjs().subtract(180, "day").valueOf();//180天前
		const toDateTimestamp = filterOptions?.toDate
			? dayjs(filterOptions.toDate).valueOf()
			: dayjs().valueOf();
		// 创建时间或截止时间在startDate之前的
		const uncompleted = await this.getUnCompletedTasks(filterOptions.projectId, startDateTimestamp, toDateTimestamp);

		const completed = await this.getCompletedTasks(filterOptions.projectId, startDateTimestamp, toDateTimestamp);

		const filterTags = (item: ITaskItem) => {
			// ExcludeTag优先级更高,只要命中则把这个task去掉
			if (filterOptions.excludeTags?.length && item.tags?.length) {
				const _tags = Array.isArray(filterOptions.excludeTags)
					? filterOptions.excludeTags
					: [filterOptions.excludeTags];

				if (_tags?.some((t) => item.tags.includes(t))) {
					return false;
				}
			}

			if (filterOptions.tags?.length) {
				if (!item.tags?.length) {
					return false;
				}

				const _tags = Array.isArray(filterOptions.tags)
					? filterOptions.tags
					: [filterOptions.tags];
				return _tags?.some((t) => item.tags.includes(t));
			}

			return true;
		};

		const filterStatus = (item: ITaskItem) => {
			if (typeof filterOptions?.status !== "number") {
				return true;
			}

			return item.status === filterOptions.status;
		};

		const filterTaskId = (item: ITaskItem) => {
			if (!filterOptions?.taskId) {
				return true;
			}

			return item.id === filterOptions.taskId;
		};

		this.log("uncompleted", uncompleted);
		this.log("completed", completed);
		let allTask = [...uncompleted, ...completed];
		// allTask = allTask.filter(noAbandoned);
		// this.log("allTask(after noAbandoned)", allTask);

		allTask = allTask.filter(filterStatus);
		this.log("allTask(after filterStatus)", allTask);

		allTask = allTask.filter(filterTags);
		this.log("allTask(after filterTags)", allTask);

		allTask = allTask.filter(filterTaskId);
		this.log("allTask(after filterTaskId)", allTask);

		// allTask = allTask.sort(
		// 	(a, b) =>
		// 		dayjs(b.createdTime).valueOf() - dayjs(a.createdTime).valueOf(),
		// );
		this.log("allTask(after sort)", allTask);

		return allTask;
	}

	public async downloadAttachment(item: ITaskItem) {
		const result = item.attachments.map(async (attachment) => {
			const url = `${this.options.apiHost}/api/v1/attachment/${item.projectId
				}/${item.id}/${attachment.id}${path.extname(attachment.path)}`;
			return requestUrl({
				url,
				headers: {
					Cookie: this.cookieHeader,
				},
				method: "GET",
			}).then((res) => ({
				...attachment,
				arrayBuffer: res.arrayBuffer,
			}));
		});
		return Promise.allSettled(result);
	}
	private async getUpdateInfo() {
		await this.checkLogin();
		const url = `${this.options.apiHost}/api/v2/batch/check/0`;
		const result: IDidaAllInfo = await requestUrl({
			url,
			headers: {
				Cookie: this.cookieHeader,
			},
			method: "GET",
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		}).then((r) => {
			if (r.status === 200) {
				return r.json;
			} else {
				logMessage(`【DidaSync】获取信息失败,code:${r.status}`, LogLevel.info);
			}

		});
		this._allInfo = result;
		let projectProfiles = result.projectProfiles;
		let projNameIdMap = this._dataCache.projNameIdMap;
		let projIdNameMap = this._dataCache.projIdNameMap
		for (let projProfile of projectProfiles) {
			projNameIdMap[projProfile.name] = projProfile.id;
			projIdNameMap[projProfile.id] = projProfile.name;
		}

		let tagIdNameMap = this._dataCache.tagIdNameMap;
		let tags = result.tags;


		for (let tagInfo of tags) {

			tagIdNameMap[tagInfo.name] = tagInfo.label;
		}
		for (let tagInfo of tags) {
			if (tagInfo.parent) {
				let parentName = tagIdNameMap[tagInfo.parent];
				tagIdNameMap[tagInfo.name] = `${parentName}/${tagInfo.label}`;
			}
		}
		return result;
	}
	private async getUnCompletedTasks(projectId: string = 'all', fromTimestamp: number, toTimestamp: number, limit: number = -1) {
		const url = `${this.options.apiHost}/api/v2/project/${projectId}/tasks`;
		const params = {
			from: dayjs(fromTimestamp).format("YYYY-MM-DD%20HH:mm:ss"),
			to: dayjs(toTimestamp).format("YYYY-MM-DD%20HH:mm:ss"),
			limit: limit > 0 ? limit : -1,
		};
		this.log(
			"getAllCompleted params:",
			params,
			`${url}?${qs.stringify(params, undefined, undefined, {
				encodeURIComponent(str) {
					return str;
				},
			})}`,
		);
		const result = await requestUrl({
			url: `${url}?${qs.stringify(params, undefined, undefined, {
				encodeURIComponent(str) {
					return str;
				},
			})}`,
			headers: {
				Cookie: this.cookieHeader,
			},
			method: "GET",
		}).then((r) => r.json as ITaskItem[]);
		return result;
	}
	/**
	 * 获取完成的&取消的任务
	 * @param projectId 
	 * @param fromTimestamp 
	 * @param toTimestamp 
	 * @param limit 
	 * @returns 
	 */
	private async getCompletedTasks(projectId: string = 'all', fromTimestamp: number, toTimestamp: number, limit: number = -1) {
		const url = `${this.options.apiHost}/api/v2/project/${projectId}/completed`;
		const params = {
			from: dayjs(fromTimestamp).format("YYYY-MM-DD%20HH:mm:ss"),
			to: dayjs(toTimestamp).format("YYYY-MM-DD%20HH:mm:ss"),
			limit: limit > 0 ? limit : -1,
		};
		this.log(
			"getCompleted params:",
			params,
			`${url}?${qs.stringify(params, undefined, undefined, {
				encodeURIComponent(str) {
					return str;
				},
			})}`,
		);
		const result = await requestUrl({
			url: `${url}?${qs.stringify(params, undefined, undefined, {
				encodeURIComponent(str) {
					return str;
				},
			})}`,
			headers: {
				Cookie: this.cookieHeader,
			},
			method: "GET",
		}).then((r) => r.json as ITaskItem[]);
		return result;
	}

	/**
	 * Login to dida365, necessary to make any other request
	 */
	private async checkLogin() {
		if (this.expTime && this.expTime > Date.now()) {
			return;
		}

		const url = `${this.options.apiHost}/api/v2/user/signon?wc=true&remember=true`;

		const options = {
			username: this.options.username,
			password: this.options.password,
		};

		const result = requestUrl({
			url,
			body: JSON.stringify(options),
			headers: {
				"Content-Type": "application/json",
				"x-device":
					'{"platform":"web","os":"macOS 10.15.7","device":"Chrome 114.0.0.0","name":"","version":4562,"id":"64217d45c3630d2326189adc","channel":"website","campaign":"","websocket":""}',
			},
			method: "POST",
		})
			.then((result) => {
				this.cookies =
					(result.headers["set-cookie"] as unknown as string[]) ?? [];
				this.cookieHeader = this.cookies.join("; ") + ";";
				this.didaAccountInfo = result.json;
				// 1 days
				this.expTime = Date.now() + 1000 * 60 * 60 * 24;
			})
			.catch((e) => {
				console.log(e);
			});

		return result;
	}
}

export class TodoAppClientFacade {
	private readonly didaClient: DiDa365API;
	private readonly ttClient: DiDa365API;
	file: File;
	constructor(private readonly options: DiDa365APIOptions, file: File) {
		// this.didaClient = new DiDa365API({
		// 	...options,
		// });
		// this.ttClient = new DiDa365API({
		// 	...options,
		// 	apiHost: "https://api.ticktick.com",
		// 	host: "https://ticktick.com",
		// });
		this.file = file;
	}

	async getItems(filterOptions: DidaConfig): Promise<ITaskItem[]> {
		if (filterOptions.type === ServeType.Dida) {
			return this.didaClient.getItems(filterOptions);
		}

		return this.ttClient.getItems(filterOptions);
	}

	async downloadAttachment(item: ITaskItem, type: ServeType) {
		if (type === ServeType.Dida) {
			return this.didaClient.downloadAttachment(item);
		}

		return this.ttClient.downloadAttachment(item);
	}


}
