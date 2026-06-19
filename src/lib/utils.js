/**
 * utils.js — 通用工具函数
 * ====================================================
 * 一些与具体业务无关的、可复用的纯函数。
 */

/**
 * className 拼接工具（类似 classnames 库）
 * 过滤掉假值（false/null/undefined）后用空格拼接
 * @param  {...any} classes - 任意 class 字符串或条件表达式
 * @returns {string} 拼接后的 className
 * @example
 *   cn('btn', isActive && 'active', null) => 'btn active'
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
