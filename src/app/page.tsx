import { ThreadsSidebar } from "@/components/layout/threads-sidebar";
import { Stage } from "@/components/layout/stage";

/**
 * @function Home
 * @description 应用的默认首页路由组件 (`/`)。
 * 负责组装主聊天界面的核心两列结构：历史会话栏和交互舞台。
 *
 * @returns {JSX.Element} 完整的聊天应用主体视图
 */
export default function Home() {
  return (
    // 使用 React Fragment (空标签) 避免引入不必要的额外 DOM 层级
    // 该内容会被直接注入到 RootLayout 的 .content 容器的 Grid 布局上下文中
    <>
      {/* 历史会话侧边栏组件 - 负责显示之前的对话列表或开启新对话 */}
      <ThreadsSidebar />
      {/* 交互核心舞台组件 - 包含当前选中的聊天气泡流以及底部的输入框区域 */}
      <Stage />
    </>
  );
}