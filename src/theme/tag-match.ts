/** A parent tag includes its descendants, never a sibling with a similar prefix. */
export function matchesThemeTag(itemTags: string[], themeTags: string[]): boolean {
  const normalize = (tag: string) => tag.replace(/^#/, '').toLowerCase();
  return itemTags.some((item) =>
    themeTags.some((theme) => {
      const tag = normalize(item),
        target = normalize(theme);
      return tag === target || tag.startsWith(`${target}/`);
    }),
  );
}
