/**
 * 블록을 앞/뒤 형제와 자리바꿈한다.
 *
 * ProseMirror 에는 "블록 이동" 명령이 없어서 직접 지우고 다시 넣는다.
 * 삭제하면 뒤쪽 좌표가 밀리므로 삽입 위치는 반드시 tr.mapping 으로 변환해야 한다.
 * 이걸 빼먹으면 아래로 이동할 때 엉뚱한 자리에 들어간다.
 *
 * 본문 사진과 전후비교 블록이 같은 규칙으로 움직이도록 한 곳에 둔다.
 */
export function moveBlock(editor: any, getPos: () => number | undefined, dir: -1 | 1) {
  const pos = getPos();
  if (typeof pos !== "number") return;

  const { state, view } = editor;
  const $pos = state.doc.resolve(pos);
  const parent = $pos.parent;
  const index = $pos.index();
  const targetIndex = index + dir;
  if (targetIndex < 0 || targetIndex >= parent.childCount) return;

  // 부모 안에서 이 노드의 시작 좌표를 앞 형제들의 크기로 계산한다.
  let from = $pos.start();
  for (let i = 0; i < index; i++) from += parent.child(i).nodeSize;

  const self = parent.child(index);
  const to = from + self.nodeSize;

  const insertAt =
    dir === -1
      ? from - parent.child(index - 1).nodeSize
      : to + parent.child(index + 1).nodeSize;

  const tr = state.tr.delete(from, to);
  tr.insert(tr.mapping.map(insertAt), self);
  view.dispatch(tr);
}
