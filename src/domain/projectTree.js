function filterNode(node, roleId) {
  if (!node.children?.length) {
    return !node.roles || node.roles.includes(roleId) ? node : null
  }
  if (node.roles && !node.roles.includes(roleId)) return null

  const children = node.children
    .map((child) => filterNode(child, roleId))
    .filter(Boolean)
  return children.length ? { ...node, children } : null
}

export function filterProjectTree(tree, roleId) {
  return tree.map((node) => filterNode(node, roleId)).filter(Boolean)
}
