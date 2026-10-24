export const variants = {
  'tree-business':{kind:'tree',code:'01 A',title:'利润降了，先拆原因',tag:'经营分析 · 假设线索',root:'利润下降',branches:['收入端','成本端'],leaves:['销量下降','单价下降','单位成本','产品结构'],highlight:[0,1],takeaway:'顺着证据，定位到具体变量。',detail:'这是诊断树示意，分支可能同时发生。'},
  'tree-learning':{kind:'tree',code:'01 B',title:'学不会，先拆卡点',tag:'学习方法 · 假设线索',root:'学习受阻',branches:['理解端','提取端'],leaves:['概念不清','例子不足','练习偏少','间隔太长'],highlight:[1,0],takeaway:'同一个诊断动作，换一篇文章。',detail:'分支仅作示例，不代表完整学习模型。'},
  'matrix-price':{kind:'matrix',code:'02 A',title:'为什么都降价？',tag:'竞争策略 · 自拟收益表',rows:['你维持','你降价'],cols:['他维持','他降价'],cells:[[{main:'3 / 3',sub:'双方都维持'},{main:'1 / 4',sub:'只有他降价'}],[{main:'4 / 1',sub:'只有你降价'},{main:'2 / 2',sub:'双方都降价'}]],takeaway:'各自选更优，合起来可能更差。',detail:'分数仅演示博弈，不代表真实利润。'},
  'matrix-sharing':{kind:'matrix',code:'02 B',title:'为什么都不共享？',tag:'团队协作 · 自拟收益表',rows:['你共享','你保留'],cols:['他共享','他保留'],cells:[[{main:'3 / 3',sub:'双方共享经验'},{main:'1 / 4',sub:'只有你分享'}],[{main:'4 / 1',sub:'只有他分享'},{main:'2 / 2',sub:'双方都保留'}]],takeaway:'换成协作问题，动作和逻辑复用。',detail:'这是设定的激励模型，现实收益需另证。'},
  'orbit-signal':{kind:'orbit',code:'03 A',title:'把信号留下',tag:'信息筛选 · 视觉重音',words:['SIGNAL','NOISE','DATA','WHY?','FILTER','信号','噪声','证据'],anchor:'SIGNAL',cn:'多看见，不等于多知道。',detail:'空间文字用于章节重音；解释随后落稳。'},
  'orbit-value':{kind:'orbit',code:'03 B',title:'穿过价格，看见价值',tag:'价值判断 · 视觉重音',words:['PRICE','VALUE','COST','WHY?','FUTURE','价格','价值','证据'],anchor:'VALUE',cn:'先看价格背后的依据。',detail:'复用同一镜头路径，仅替换词组和标题。'}
} as const;
export type DemoId=keyof typeof variants;
export const demoIds=Object.keys(variants) as DemoId[];
