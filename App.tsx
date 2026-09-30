import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

type Tab = 'today' | 'wisdom' | 'learn' | 'laws' | 'review';
type Category = 'personality' | 'social' | 'bio';
type Course = { id: string; category: Category; title: string; summary: string; time: string; core: string; example: string; observe: string; practice: string };
type AppState = { date: string; rhythm: Record<string, boolean>; lawEnabled: Record<string, boolean>; lawIndex: number; task: string; taskDone: boolean; energy: string; coursesDone: Record<string, boolean>; notes: Record<string, string>; review: { win: string; feel: string; next: string } };

const RED = '#E53935';
const INK = '#171717';
const MUTED = '#777';
const LINE = '#E8E5E2';
const BG = '#FFFFFF';
const SOFT = '#FFF7F6';
const rhythm = [
  ['wake', '起床', '闹钟响后，双脚落地'], ['groom', '整理', '收拾头发，进入状态'], ['work', '工作', '完成最重要的一件事'],
  ['train', '健身', '哪怕只做二十分钟'], ['care', '护肤', '用固定动作照顾自己'], ['sleep', '睡觉', '给明天保留精力'],
] as const;
const laws = [
  ['起床法则', '闹钟响后，不做第二个决定：坐起，双脚落地，拉开窗帘。'],
  ['启动法则', '不要求完成，只要求开始十分钟。'],
  ['时间法则', '重要事项设置开始时间，不等截止时间来催你。'],
  ['延误法则', '错过一个节点，不放弃整天，直接执行下一个节点。'],
  ['低精力法则', '状态差就做保底版本：少一点，但不要归零。'],
  ['睡眠法则', '睡前进入收尾流程，把手机放远，为明天保留精力。'],
] as const;
type WisdomItem = { title: string; body: string; practice: string };
const wisdomItems: WisdomItem[] = [
  {title:'认识自己', body:'不知道自己是谁的人，很容易被环境替自己定义。先看见自己的欲望、恐惧和反复出现的模式。', practice:'记录今天一次真实的渴望，以及你真正害怕的东西。'},
  {title:'尊重事实', body:'愿望可以指引方向，但只有事实可以校准方向。允许新证据改变判断，是成熟而不是失败。', practice:'写下一件你最近可能判断错了的事，并寻找一个新证据。'},
  {title:'知道什么值得追求', body:'人生不是把所有东西都得到，而是选择少数真正重要的东西。方向比速度更重要。', practice:'删掉一个今天并不重要、却占用注意力的目标。'},
  {title:'承担选择的代价', body:'每一种自由都有责任，每一种获得都有牺牲。愿望和代价必须一起选择。', practice:'为一个目标写下你愿意放弃的东西。'},
  {title:'把时间用在能够复利的事情上', body:'健康、知识、信誉、能力和关系，会在多年后放大今天的选择。', practice:'今天为一个能积累十年的事情投入二十分钟。'},
  {title:'控制能控制的，接受不能控制的', body:'把注意力从他人的评价、运气和结果收回到准备、行动和反应。', practice:'把一件焦虑写成“我能做的下一步”。'},
  {title:'理解人性，却保留自己的边界', body:'看懂利益、恐惧和权力，但不为了获胜而牺牲尊严与良知。', practice:'在一个小场景里，既表达自己，也尊重对方的边界。'},
  {title:'行动比幻想更接近真理', body:'行动会产生反馈，反馈会修正判断。先做一个小实验，再谈宏大结论。', practice:'把一个想法变成今天可以完成的十分钟实验。'},
  {title:'爱与被爱需要经营', body:'吸引让关系开始，回应、信任和修复让关系继续。', practice:'主动联系一个你在乎的人，问一个真正关心的问题。'},
  {title:'定义“够”，成为自己愿意尊敬的人', body:'外界不会替你宣布胜利。你要决定什么值得、什么不能牺牲。', practice:'写下“对我来说，足够的一天是什么样”。'},
];
const successRules: WisdomItem[] = [
  {title:'一、选择你真正认同的方向', body:'成功和幸福很难建立在完全借来的目标上。你需要同时拥有自主感、能力感和与他人的连接感；这三种需要是稳定动机和良好发展的核心。', practice:'把一个“别人希望我做”的目标，改写成“我为什么愿意做”。'},
  {title:'二、把愿望变成可重复的系统', body:'只说“我要自律”不够。把行动写成“如果出现某个时刻，我就做某个具体动作”，比依赖当下情绪更可靠。', practice:'写一个 if–then 计划：如果闹钟响，我就坐起并把脚放到地上。'},
  {title:'三、把关系当作人生主线', body:'长期追踪研究反复指向同一个事实：高质量的亲密关系与健康、幸福和长久生活密切相关。事业不能替代被理解、被支持和去爱别人。', practice:'今天给一个重要的人留出十分钟，不 multitask，只认真在场。'},
  {title:'四、先保护身体和精力', body:'身体活动与更好的心理、认知和睡眠结果相关。高精力不是靠意志硬挤出来的，而是靠睡眠、运动、饮食和恢复共同供给。', practice:'今天完成一个最低版本：十分钟快走、按时吃饭或提前半小时上床。'},
  {title:'五、追求持续进步，不追逐无止境的更多', body:'真正可持续的成功，是让能力、关系和内在稳定一起增长。把进步当作方向，把“够”当作边界，才能让成就与幸福共存。', practice:'记录今天一个微小进步，并写下明天可以重复的动作。'},
];
const courses: Course[] = [
  ['p1','personality','人格是什么：特质与倾向','理解人格如何影响选择，又为什么不是命运。','5 min','人格是一组相对稳定、但仍能被环境和练习影响的倾向。它会影响注意、压力处理和关系方式。','同一场会议里，有人先观察再发言，有人边说边思考。这不是谁更好，而是表达方式不同。','我在什么场景里最像自己？','记录一次自然反应，并写下另一种也可以选择的反应。'],
  ['p2','personality','大五人格：不是标签，是地图','用五个维度看见自己的倾向。','7 min','大五人格描述连续维度，而不是把人塞进固定类型。高低没有绝对好坏，重要的是情境匹配。','高尽责有助于长期项目，但过高可能变成完美主义。','我的优势在什么情境里会变成负担？','选一个维度，用 1 到 10 分估计自己，并写出一条证据。'],
  ['p3','personality','依恋：亲近与距离的模式','理解你在关系里如何靠近和退开。','6 min','依恋模式常在压力和亲密关系中显现，但可以通过安全关系和新的沟通经验改变。','对方迟迟不回消息时，有人不断确认，有人立即抽离。两者都可能是在保护自己。','我害怕被拒绝时，会更靠近还是更退开？','用“我感到……我需要……”表达一次需要。'],
  ['p4','personality','自尊：不是永远喜欢自己','把自我价值从表现和评价中分离。','5 min','稳定的自尊不是永远自信，而是犯错时不把一次行为等同于整个人。','“我这次做得不好”是反馈；“我就是没用”是身份攻击。','我最近对自己使用了哪些绝对词？','把一句自我攻击改写成具体、可行动的反馈。'],
  ['p5','personality','防御机制：心灵如何保护自己','识别否认、合理化、投射和回避。','7 min','防御机制常是在压力下保护心理稳定的自动方式。成熟不是消灭防御，而是在安全时看见它。','把失败归咎于环境能暂时保护自尊，却也可能让你失去修正机会。','我最常用什么方式避免感到脆弱？','想立刻解释或反击时，先停三次呼吸。'],
  ['p6','personality','人格与环境：你不是孤立的','看见环境、角色和关系如何塑造行为。','6 min','人格与环境持续相互作用。选择环境也是塑造自己的方式。','在尊重犯错的团队里，谨慎的人可能逐渐更敢表达。','什么环境会让我自然变好？','主动调整一个影响你行为的环境线索。'],
  ['p7','personality','人格可以改变吗？','用小而重复的行为成为新的自己。','5 min','倾向可以稳定，但行为、习惯和关系经验会改变你实际表现出的样子。','每天五分钟的启动仪式，也能让“不自律的人”建立行动模式。','我想改变的是标签，还是具体行为？','为想改变的特质设计一个每天五分钟的证据。'],
  ['s1','social','从众：为什么跟着多数人走','识别群体压力，保留自己的判断。','5 min','人会从群体获取信息，也会为了归属调整表达。多数意见不等于事实。','房间里所有人点头时，你可能压下自己的疑问。','我在哪些人面前最容易改变立场？','提出一个温和的不同意见。'],
  ['s2','social','社会比较：羡慕在告诉你什么','把比较转化为信息，而不是惩罚。','6 min','比较能帮助定位，也会制造焦虑。比较过程和策略，而不是别人的剪辑人生。','看到别人进步时，先问“他做了什么”，不要只问“我为何不如他”。','我羡慕的东西背后是哪一种需要？','把一次羡慕写成一个可学习的动作。'],
  ['s3','social','归因偏差：我们如何解释别人','区分一个人的性格和当下处境。','6 min','我们容易把别人归因于性格，却把自己归因于情境。更准确的判断需要同时看人和环境。','同事迟到可能是散漫，也可能是突发状况。','我是否对别人比对自己更快下结论？','为一个不舒服的行为写出三个可能原因。'],
  ['s4','social','权威与服从：何时该停下来','尊重专业，但不交出自己的判断。','7 min','权威能提高效率，也可能让人放弃责任。成熟的服从包含提问和边界。','“大家都这样做”不能替代对风险和价值的判断。','我在哪些场景里会把责任交给权威？','对一个重要指令补问“目的和边界是什么？”'],
  ['s5','social','第一印象：快，但不总是准','知道直觉有用，也知道它会偏。','5 min','大脑会快速形成判断，但初印象容易受刻板印象和当下状态影响。','安静的人可能是谨慎，也可能只是疲惫。','我会对哪类人快速贴标签？','写下一个支持和一个反驳证据。'],
  ['s6','social','群体与权力：谁决定规则','看见群体结构如何影响机会和发言。','7 min','理解权力不是为了操控，而是知道自己和他人所处的位置。','会议中谁先说话、谁被打断，往往显示真实结构。','我在哪些群体里拥有声音？','让一个被忽略的人完整说完观点。'],
  ['s7','social','亲密关系：吸引之外是修复','把爱理解为持续的理解与沟通。','6 min','吸引让关系开始，回应和修复让关系继续。','讨论具体行为，比给对方贴“你总是”的标签更容易修复。','我在冲突里更想赢，还是更想理解？','用“我感到……当……我希望……”表达。'],
  ['b1','bio','睡眠与昼夜节律','理解为什么睡不好会让一切更难。','6 min','睡眠影响注意、情绪、记忆和冲动控制。稳定起床时间通常比临时补救更有效。','缺觉时更容易选择即时奖励，也更难承受挫折。','我的精力低谷通常在什么时候？','今晚提前三十分钟离开高刺激内容。'],
  ['b2','bio','压力系统：身体在保护你','区分短期动员和长期耗竭。','7 min','短期压力有用，长期持续开启会消耗恢复能力。','持续赶工可能让效率短暂上升，却让睡眠和情绪下降。','身体如何告诉我压力过量？','做五轮较慢呼气，把注意力带回身体。'],
  ['b3','bio','多巴胺与奖励预测','即时奖励为什么会劫持注意力。','7 min','多巴胺更像想要和预测信号。新鲜、随机和快速反馈会让行为特别有吸引力。','消息提示和短视频让深度工作更难开始。','什么最容易让我无意识反复刷新？','移除一个高诱惑入口，设置十分钟启动。'],
  ['b4','bio','情绪与大脑','情绪是信息，不是命令。','6 min','情绪帮助快速评估重要性，但不一定完整准确。命名情绪可以扩大反应空间。','“我感到被忽视”比“他们不在乎我”更接近经验。','我能准确说出此刻的情绪吗？','用“我感到……因为我在乎……”写一句话。'],
  ['b5','bio','运动与认知','身体活动如何帮助注意力和恢复。','5 min','规律运动有助于睡眠、情绪和执行功能，短时间快走也能成为入口。','卡住时离开屏幕走十分钟，常比硬撑更快恢复思路。','什么活动会让我更清醒？','安排一次十分钟快走。'],
  ['b6','bio','成瘾与环境线索','理解为什么只靠意志力很难抵抗诱惑。','8 min','成瘾行为常被线索、情绪和场景触发。改变环境比责备自己有效。','手机放在床边，会让醒来就刷变成自动程序。','冲动通常由什么时间、地点或情绪触发？','移除一个触发线索，准备替代动作。'],
  ['b7','bio','神经可塑性：重复留下道路','为什么小而稳定的练习能改变大脑。','6 min','神经系统会根据反复使用的路径调整连接。改变来自重复，不是一次顿悟。','每天五分钟的专注，比偶尔两小时更容易形成能力。','我每天正在强化哪条道路？','安排连续七天的最小练习。'],
].map(([id,category,title,summary,time,core,example,observe,practice])=>({id,category: category as Category,title,summary,time,core,example,observe,practice}));

const initial: AppState = { date: new Date().toISOString().slice(0,10), rhythm: {}, lawEnabled: {}, lawIndex: 0, task: '完成那件你已经推迟了三天的事。', taskDone: false, energy: '尚可', coursesDone: {}, notes: {}, review: { win:'', feel:'', next:'' } };
const today = new Date().toISOString().slice(0,10);
function freshState(raw: Partial<AppState> | null): AppState { const base = {...initial, ...(raw || {})}; return base.date === today ? base : {...initial, date: today}; }

export default function App() {
  const [state, setState] = useState<AppState>(initial);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('today');
  const [courseFilter, setCourseFilter] = useState<'all' | Category>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lawIndex, setLawIndex] = useState(0);
  const [timer, setTimer] = useState(600);
  const [running, setRunning] = useState(false);

  useEffect(() => { AsyncStorage.getItem('chocolately-state').then(raw => { setState(freshState(raw ? JSON.parse(raw) : null)); setReady(true); }); }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem('chocolately-state', JSON.stringify(state)); }, [state, ready]);
  useEffect(() => { if (!running) return; const id = setInterval(() => setTimer(t => { if (t <= 1) { setRunning(false); return 0; } return t - 1; }), 1000); return () => clearInterval(id); }, [running]);

  const doneCount = Object.values(state.rhythm).filter(Boolean).length;
  const visibleCourses = useMemo(() => courseFilter === 'all' ? courses : courses.filter(c => c.category === courseFilter), [courseFilter]);
  const formatTimer = `${String(Math.floor(timer/60)).padStart(2,'0')}:${String(timer%60).padStart(2,'0')}`;
  const update = (patch: Partial<AppState>) => setState(prev => ({...prev, ...patch}));
  const toggleRhythm = (id: string) => update({ rhythm: {...state.rhythm, [id]: !state.rhythm[id]} });
  const currentLaw = laws[lawIndex % laws.length];

  if (!ready) return <View style={styles.loading}><ActivityIndicator color={RED}/></View>;

  return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <StatusBar style="dark" />
    <View style={styles.appBar}><View style={styles.brandRow}><View style={styles.logo}><View style={styles.logoDot}/></View><Text style={styles.brand}>Chocolately</Text></View><Text style={styles.date}>{new Date().toLocaleDateString('en-US',{weekday:'short',day:'2-digit',month:'short'}).toUpperCase()}</Text></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {tab === 'today' && <Today state={state} doneCount={doneCount} currentLaw={currentLaw} onToggle={toggleRhythm} onLawNext={() => setLawIndex((lawIndex+1)%laws.length)} onTask={task => update({task})} onTaskDone={() => update({taskDone: !state.taskDone})} onGoReview={() => setTab('review')} onGoLaws={() => setTab('laws')} />}
      {tab === 'wisdom' && <Wisdom />}
      {tab === 'learn' && <Learn courses={visibleCourses} filter={courseFilter} done={state.coursesDone} onFilter={setCourseFilter} onOpen={setSelectedCourse} />}
      {tab === 'laws' && <Laws state={state} onToggleLaw={(i) => update({lawEnabled: {...state.lawEnabled, [i]: state.lawEnabled[i] === false}})} onMinimum={() => update({task:'喝水、洗脸、走十分钟、按时上床。', taskDone:false})} />}
      {tab === 'review' && <Review state={state} onSave={(review) => update({review})} />}
    </ScrollView>
    <View style={styles.tabBar}>{([['today','今日','sparkles-outline'],['wisdom','智慧','bulb-outline'],['learn','学习','book-outline'],['laws','法则','shield-checkmark-outline'],['review','复盘','moon-outline']] as const).map(([key,label,icon]) => <Pressable key={key} style={styles.tabItem} onPress={() => setTab(key)}><Ionicons name={icon as any} size={20} color={tab===key?RED:MUTED}/><Text style={[styles.tabLabel, tab===key && styles.tabLabelActive]}>{label}</Text></Pressable>)}</View>
    <CourseModal course={selectedCourse} done={!!(selectedCourse && state.coursesDone[selectedCourse.id])} note={selectedCourse ? (state.notes[selectedCourse.id] || '') : ''} onClose={() => setSelectedCourse(null)} onDone={() => { if (selectedCourse) update({coursesDone:{...state.coursesDone,[selectedCourse.id]:true}}); }} onNote={(text) => { if(selectedCourse) update({notes:{...state.notes,[selectedCourse.id]:text}}); }} />
  </KeyboardAvoidingView>;
}

function Today({state,doneCount,currentLaw,onToggle,onLawNext,onTask,onTaskDone,onGoReview,onGoLaws}:{state:AppState;doneCount:number;currentLaw:readonly [string,string];onToggle:(id:string)=>void;onLawNext:()=>void;onTask:(t:string)=>void;onTaskDone:()=>void;onGoReview:()=>void;onGoLaws:()=>void}){
  const [editing,setEditing]=useState(false); const [task,setTask]=useState(state.task);
  return <><View style={styles.homeMeta}><Text style={styles.homeMetaText}>01 / TODAY</Text><View style={styles.homeMetaRule}/><Text style={styles.homeMetaText}>PERSONAL RHYTHM</Text></View><Text style={styles.hero}>今天，先把自己{`\n`}带回<Text style={styles.red}>当下。</Text></Text><Text style={styles.subhero}>不追求完美的一天。{`\n`}只让重要的事发生。</Text>
    <View style={styles.warningCard}><View style={styles.rowBetween}><Text style={styles.cardTitle}>今日警示</Text><Text style={styles.meta}>01 / 05</Text></View><Text style={styles.quote}>“不要在追求成功的过程中，变成自己不愿意相处的人。”</Text><Pressable onPress={onGoLaws}><Text style={styles.link}>重新阅读五条警示 ↗</Text></Pressable></View>
    <View style={styles.actionCard}><View style={styles.rowBetween}><Text style={styles.cardTitle}>今日的一步</Text><Text style={styles.meta}>现在</Text></View>{editing ? <TextInput autoFocus value={task} onChangeText={setTask} onSubmitEditing={() => {onTask(task);setEditing(false)}} style={styles.taskInput} /> : <Pressable onPress={() => setEditing(true)}><Text style={styles.task}>{state.task}</Text></Pressable>}<Pressable style={styles.checkRow} onPress={onTaskDone}><View style={[styles.checkbox, state.taskDone && styles.checkboxDone]}>{state.taskDone && <Text style={styles.checkmark}>✓</Text>}</View><Text style={styles.checkText}>{state.taskDone?'已完成，继续保持':'我已经开始了'}</Text></Pressable><View style={styles.progress}><View style={[styles.progressFill,{width:state.taskDone?'100%':'0%'}]}/></View></View>
    <View style={styles.rhythmCard}><View style={styles.rowBetween}><View><Text style={styles.cardTitle}>今日节律</Text><Text style={styles.muted}>完成六个基础动作，掌控感会回来。</Text></View><Text style={styles.score}>{doneCount} / 6</Text></View><View style={styles.rhythmGrid}>{rhythm.map(([id,label,small])=><Pressable key={id} onPress={() => onToggle(id)} style={[styles.rhythmButton,state.rhythm[id]&&styles.rhythmDone]}><Text style={[styles.rhythmLabel,state.rhythm[id]&&styles.red]}>{label}</Text><Text style={styles.rhythmSmall}>{state.rhythm[id]?'完成':small}</Text></Pressable>)}</View></View>
    <View style={styles.lawCard}><View style={styles.rowBetween}><View><Text style={styles.cardTitle}>今日掌控法则</Text><Text style={styles.muted}>{currentLaw[0]}</Text></View><Pressable onPress={onLawNext}><Text style={styles.link}>换一条 ↻</Text></Pressable></View><Text style={styles.lawText}>{currentLaw[1]}</Text><Pressable onPress={onGoLaws}><Text style={styles.link}>管理全部法则 ↗</Text></Pressable></View>
    <Pressable style={styles.reviewLink} onPress={onGoReview}><Text style={styles.reviewLinkText}>今晚，花一分钟回看今天</Text><Text style={styles.red}>↗</Text></Pressable>
  </>;
}

function Wisdom(){const [open,setOpen]=useState<string|null>(null);const renderItem=(item:WisdomItem,kind:string)=><Pressable key={item.title} onPress={()=>setOpen(open===kind+item.title?null:kind+item.title)} style={[styles.wisdomCard,open===kind+item.title&&styles.wisdomCardOpen]}><View style={styles.rowBetween}><Text style={styles.wisdomTitle}>{item.title}</Text><Text style={styles.wisdomChevron}>{open===kind+item.title?'−':'＋'}</Text></View>{open===kind+item.title&&<><Text style={styles.wisdomBody}>{item.body}</Text><Text style={styles.wisdomPractice}>今日实践 · {item.practice}</Text></>}</Pressable>;return <><Text style={styles.eyebrowText}>ACROSS TIME & CULTURES</Text><Text style={styles.pageTitle}>智慧</Text><Text style={styles.pageIntro}>让古今中外的经验，变成今天可以使用的判断。</Text><Text style={styles.sectionHeading}>十条世界智慧</Text><View style={styles.wisdomList}>{wisdomItems.map((item)=>renderItem(item,'wisdom-'))}</View><Text style={styles.sectionHeading}>五条成功与幸福准则</Text><Text style={styles.wisdomIntro}>它们不是保证成功的公式，而是许多长期研究与真实人生反复指向的共同原则。</Text><View style={styles.wisdomList}>{successRules.map((item)=>renderItem(item,'rule-'))}</View></>}

function Learn({courses:visible,filter,done,onFilter,onOpen}:{courses:Course[];filter:'all'|Category;done:Record<string,boolean>;onFilter:(v:'all'|Category)=>void;onOpen:(c:Course)=>void}){return <><Text style={styles.eyebrowText}>UNDERSTAND YOURSELF</Text><Text style={styles.pageTitle}>心理学学习</Text><Text style={styles.pageIntro}>21 节基础课，把理解自己变成长期练习。</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{([['all','全部'],['personality','人格'],['social','社会'],['bio','生物']] as const).map(([key,label])=><Pressable key={key} onPress={() => onFilter(key)} style={[styles.filter,filter===key&&styles.filterActive]}><Text style={[styles.filterText,filter===key&&styles.filterTextActive]}>{label}</Text></Pressable>)}</ScrollView><Text style={styles.courseCount}>{Object.values(done).filter(Boolean).length} / 21 节已完成</Text><View style={styles.courseList}>{visible.map((c,i)=><Pressable key={c.id} onPress={() => onOpen(c)} style={styles.courseRow}><Text style={styles.courseNo}>{String(i+1).padStart(2,'0')}</Text><View style={styles.flex}><Text style={styles.courseTitle}>{c.title}</Text><Text style={styles.courseSummary}>{c.summary}</Text></View><Text style={[styles.courseStatus,done[c.id]&&styles.green]}>{done[c.id]?'已完成':'未开始'}{`\n`}{c.time}</Text></Pressable>)}</View></>}

function Laws({state,onToggleLaw,onMinimum}:{state:AppState;onToggleLaw:(i:number)=>void;onMinimum:()=>void}){return <><Text style={styles.eyebrowText}>RULES FOR RETURNING</Text><Text style={styles.pageTitle}>掌控法则</Text><Text style={styles.pageIntro}>不是惩罚自己，而是替未来的自己减少选择。</Text><View style={styles.lawList}>{laws.map(([title,copy],i)=><Pressable key={title} onPress={() => onToggleLaw(i)} style={styles.lawRow}><Text style={styles.courseNo}>0{i+1}</Text><View style={styles.flex}><Text style={styles.lawTitle}>{title}</Text><Text style={styles.courseSummary}>{copy}</Text></View><View style={[styles.switch,{backgroundColor:state.lawEnabled[i]===false?'#DDD':RED}]}><View style={[styles.switchKnob,state.lawEnabled[i]===false&&styles.switchOff]}/></View></Pressable>)}</View><View style={styles.minimumCard}><Text style={styles.cardTitle}>保底模式</Text><Text style={styles.minimumText}>今天已经乱了，也不要宣布失败。只完成：喝水、洗脸、走十分钟、按时上床。</Text><Pressable style={styles.primary} onPress={onMinimum}><Text style={styles.primaryText}>开始保底模式</Text></Pressable></View></>}

function Review({state,onSave}:{state:AppState;onSave:(r:AppState['review'])=>void}){const [r,setR]=useState(state.review);return <><Text style={styles.eyebrowText}>CLOSE THE DAY GENTLY</Text><Text style={styles.pageTitle}>晚间复盘</Text><Text style={styles.pageIntro}>不打分，只是诚实地看见今天。</Text><View style={styles.reviewCard}>{([['win','今天，我做成的一件事','哪怕很小，也算数。'],['feel','今天，我感受到','给感受一个名字。'],['next','明天，我愿意迈出的最小一步','具体到可以马上开始。']] as const).map(([k,label,placeholder])=><View key={k}><Text style={styles.inputLabel}>{label}</Text><TextInput multiline value={r[k]} onChangeText={text=>setR({...r,[k]:text})} placeholder={placeholder} placeholderTextColor="#AAA" style={styles.textarea}/></View>)}<Pressable style={styles.primary} onPress={()=>onSave(r)}><Text style={styles.primaryText}>保存今天</Text></Pressable></View></>}

function CourseModal({course,done,note,onClose,onDone,onNote}:{course:Course|null;done:boolean;note:string;onClose:()=>void;onDone:()=>void;onNote:(t:string)=>void}){return <Modal visible={!!course} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={styles.modalSheet}><Pressable onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>{course&&<ScrollView showsVerticalScrollIndicator={false}><Text style={styles.eyebrowText}>{course.category.toUpperCase()} · {course.time}</Text><Text style={styles.modalTitle}>{course.title}</Text><Text style={styles.sectionLabel}>核心知识</Text><Text style={styles.bodyText}>{course.core}</Text><Text style={styles.sectionLabel}>生活中的例子</Text><Text style={styles.example}>{course.example}</Text><Text style={styles.sectionLabel}>观察自己</Text><Text style={styles.bodyText}>{course.observe}</Text><Text style={styles.sectionLabel}>今日练习</Text><Text style={styles.bodyText}>{course.practice}</Text><TextInput multiline value={note} onChangeText={onNote} placeholder="留下你的笔记……" placeholderTextColor="#AAA" style={styles.textarea}/><Pressable style={styles.primary} onPress={onDone}><Text style={styles.primaryText}>{done?'已完成 · 再读一遍':'标记为已完成'}</Text></Pressable></ScrollView>}</View></View></Modal>}

const styles=StyleSheet.create({root:{flex:1,backgroundColor:BG},loading:{flex:1,alignItems:'center',justifyContent:'center'},appBar:{height:72,paddingHorizontal:20,borderBottomWidth:1,borderBottomColor:LINE,flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:'#FFFFFF'},brandRow:{flexDirection:'row',alignItems:'center',gap:9},logo:{width:25,height:25,borderRadius:13,backgroundColor:RED,alignItems:'center',justifyContent:'center'},logoDot:{width:6,height:6,borderRadius:3,backgroundColor:'#FFF'},brand:{fontSize:18,fontWeight:'700',letterSpacing:-.4,color:INK},date:{fontSize:10,letterSpacing:1,color:MUTED},content:{padding:20,paddingTop:24,paddingBottom:110},homeMeta:{flexDirection:'row',alignItems:'center',gap:9,marginBottom:21},homeMetaText:{fontSize:9,letterSpacing:1.3,color:MUTED,fontWeight:'700'},homeMetaRule:{height:1,backgroundColor:RED,width:28},eyebrow:{marginTop:8,marginBottom:12},eyebrowText:{fontSize:10,letterSpacing:1.4,color:MUTED,fontWeight:'600'},hero:{fontSize:42,lineHeight:51,letterSpacing:-2.2,color:INK,fontWeight:'400',marginBottom:11},red:{color:RED},subhero:{fontSize:13,lineHeight:22,color:MUTED,marginBottom:25},warningCard:{borderLeftWidth:3,borderLeftColor:RED,borderTopWidth:1,borderBottomWidth:1,borderColor:LINE,padding:19,paddingLeft:17,marginBottom:14,backgroundColor:'#FFF'},actionCard:{backgroundColor:'#FFF',borderWidth:1,borderColor:LINE,borderRadius:14,padding:19,marginBottom:14},rhythmCard:{borderTopWidth:1,borderBottomWidth:1,borderColor:LINE,paddingVertical:19,paddingHorizontal:2,marginBottom:14,backgroundColor:'#FFF'},lawCard:{borderLeftWidth:2,borderLeftColor:RED,borderTopWidth:1,borderBottomWidth:1,borderColor:LINE,padding:18,paddingLeft:16,marginBottom:14,backgroundColor:'#FFF'},rowBetween:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},cardTitle:{fontSize:14,fontWeight:'700',color:INK},meta:{fontSize:10,color:MUTED,letterSpacing:.6},quote:{fontSize:24,lineHeight:37,color:INK,marginVertical:25,letterSpacing:-.8,fontWeight:'400'},task:{fontSize:20,lineHeight:31,color:INK,marginVertical:20},taskInput:{fontSize:20,lineHeight:31,color:INK,borderBottomWidth:1,borderBottomColor:LINE,paddingVertical:5,marginVertical:12},checkRow:{flexDirection:'row',alignItems:'center',gap:9},checkbox:{width:18,height:18,borderRadius:5,borderWidth:1,borderColor:'#AAA',alignItems:'center',justifyContent:'center'},checkboxDone:{backgroundColor:RED,borderColor:RED},checkmark:{fontSize:12,color:'#FFF',fontWeight:'700'},checkText:{fontSize:12,color:MUTED},progress:{height:3,backgroundColor:'#EAEAEA',borderRadius:4,marginTop:18,overflow:'hidden'},progressFill:{height:'100%',backgroundColor:RED},rhythmGrid:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:17},rhythmButton:{width:'31.7%',borderWidth:1,borderColor:LINE,borderRadius:5,paddingVertical:12,alignItems:'center',backgroundColor:'#FFF'},rhythmDone:{backgroundColor:SOFT,borderColor:RED,borderWidth:1},rhythmLabel:{fontSize:12,fontWeight:'700'},rhythmSmall:{fontSize:9,color:MUTED,marginTop:4},score:{fontFamily:Platform.select({ios:'Georgia',android:'serif'}),fontSize:22,color:INK},lawText:{fontSize:17,lineHeight:29,color:INK,marginVertical:12},muted:{fontSize:10,color:MUTED,marginTop:4},link:{fontSize:11,color:RED,fontWeight:'600'},reviewLink:{flexDirection:'row',justifyContent:'space-between',paddingVertical:18,borderBottomWidth:1,borderBottomColor:INK},reviewLinkText:{fontSize:14,color:INK},pageTitle:{fontSize:39,lineHeight:46,letterSpacing:-1.8,color:INK,marginTop:6,marginBottom:9},pageIntro:{fontSize:13,lineHeight:22,color:MUTED,marginBottom:18},filters:{gap:8,paddingBottom:2},filter:{borderWidth:1,borderColor:LINE,borderRadius:20,paddingHorizontal:14,paddingVertical:9},filterActive:{backgroundColor:INK,borderColor:INK},filterText:{fontSize:11,color:MUTED},filterTextActive:{color:'#FFF'},courseCount:{fontSize:11,color:MUTED,marginVertical:15},courseList:{gap:8},courseRow:{flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderColor:LINE,borderRadius:14,padding:14},courseNo:{fontSize:10,color:RED,width:24},flex:{flex:1},courseTitle:{fontSize:15,fontWeight:'600',color:INK,marginBottom:4},courseSummary:{fontSize:11,lineHeight:16,color:MUTED},courseStatus:{fontSize:10,lineHeight:15,color:MUTED,textAlign:'right'},green:{color:'#57804B'},lawList:{gap:8,marginBottom:14},lawRow:{flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderColor:LINE,borderRadius:14,padding:14},lawTitle:{fontSize:13,fontWeight:'700',color:INK,marginBottom:4},switch:{width:38,height:22,borderRadius:11,justifyContent:'center',paddingHorizontal:2},switchKnob:{width:18,height:18,borderRadius:9,backgroundColor:'#FFF',alignSelf:'flex-end'},switchOff:{alignSelf:'flex-start'},minimumCard:{borderWidth:1,borderColor:LINE,borderRadius:16,padding:17},minimumText:{fontSize:15,lineHeight:25,color:'#444',marginVertical:12},primary:{backgroundColor:RED,borderRadius:10,paddingVertical:14,alignItems:'center',marginTop:10},primaryText:{color:'#FFF',fontSize:13,fontWeight:'700'},reviewCard:{borderWidth:1,borderColor:LINE,borderRadius:16,padding:17,gap:16},inputLabel:{fontSize:13,fontWeight:'700',color:INK,marginBottom:8},textarea:{minHeight:86,borderWidth:1,borderColor:LINE,borderRadius:10,padding:12,fontSize:13,lineHeight:21,color:INK,textAlignVertical:'top',marginBottom:4},tabBar:{height:78,borderTopWidth:1,borderTopColor:LINE,flexDirection:'row',backgroundColor:'#FFFFFF',paddingBottom:10},tabItem:{flex:1,alignItems:'center',justifyContent:'center',gap:4},tabLabel:{fontSize:10,color:MUTED},tabLabelActive:{color:RED,fontWeight:'700'},modalBackdrop:{flex:1,justifyContent:'flex-end',backgroundColor:'#0006'},modalSheet:{maxHeight:'90%',backgroundColor:'#FFF',borderTopLeftRadius:22,borderTopRightRadius:22,padding:22,paddingTop:28},close:{position:'absolute',right:16,top:10,zIndex:2},closeText:{fontSize:28,color:MUTED},modalTitle:{fontSize:28,lineHeight:36,color:INK,letterSpacing:-1,marginTop:8,marginBottom:20},sectionLabel:{fontSize:12,fontWeight:'700',color:INK,marginTop:18,marginBottom:7},bodyText:{fontSize:15,lineHeight:27,color:'#444'},example:{fontSize:14,lineHeight:25,color:'#444',borderLeftWidth:3,borderLeftColor:RED,backgroundColor:SOFT,padding:12},wisdomList:{gap:8,marginBottom:18},sectionHeading:{fontSize:13,fontWeight:'700',color:INK,marginTop:12,marginBottom:9},wisdomIntro:{fontSize:12,lineHeight:20,color:MUTED,marginBottom:10},wisdomCard:{borderWidth:1,borderColor:LINE,borderRadius:14,padding:15,backgroundColor:'#FFF'},wisdomCardOpen:{borderColor:RED,backgroundColor:SOFT},wisdomTitle:{fontSize:14,lineHeight:21,fontWeight:'600',color:INK,flex:1},wisdomChevron:{fontSize:20,color:RED,marginLeft:10},wisdomBody:{fontSize:14,lineHeight:24,color:'#444',marginTop:12},wisdomPractice:{fontSize:11,lineHeight:18,color:RED,marginTop:12}});


