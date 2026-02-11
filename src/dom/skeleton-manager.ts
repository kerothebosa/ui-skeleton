export type SkeletonManagerOptions = {
  selector: string;
  className: string;
  overlayClassName: string;
};

const SKELETON_NODE_ID = "sknet-skeleton-node";

export class SkeletonManager {
  private activeRequestIds = new Set<string>();
  private target: HTMLElement | null = null;

  constructor(private readonly options: SkeletonManagerOptions) {}

  getTarget(): HTMLElement | null {
    return this.resolveTarget();
  }

  show(requestId: string): void {
    const target = this.resolveTarget();
    if (!target) {
      return;
    }

    this.activeRequestIds.add(requestId);
    target.setAttribute("data-skeleton-visible", "true");
    target.classList.add(this.options.className);
    this.ensureSkeletonNode(target);
  }

  hide(requestId: string): void {
    const target = this.resolveTarget();
    if (!target) {
      return;
    }

    this.activeRequestIds.delete(requestId);

    if (this.activeRequestIds.size > 0) {
      return;
    }

    target.setAttribute("data-skeleton-visible", "false");
    target.classList.remove(this.options.className);
    target.querySelector(`[data-skeleton-node="${SKELETON_NODE_ID}"]`)?.remove();
  }

  cleanup(): void {
    const target = this.resolveTarget();
    if (!target) {
      return;
    }

    this.activeRequestIds.clear();
    target.setAttribute("data-skeleton-visible", "false");
    target.classList.remove(this.options.className);
    target.querySelector(`[data-skeleton-node="${SKELETON_NODE_ID}"]`)?.remove();
  }

  private resolveTarget(): HTMLElement | null {
    if (this.target && this.target.isConnected) {
      return this.target;
    }

    this.target = document.querySelector<HTMLElement>(this.options.selector);
    return this.target;
  }

  private ensureSkeletonNode(target: HTMLElement): void {
    const existing = target.querySelector(`[data-skeleton-node="${SKELETON_NODE_ID}"]`);
    if (existing) {
      return;
    }

    const node = document.createElement("div");
    node.setAttribute("data-skeleton-node", SKELETON_NODE_ID);
    node.setAttribute("aria-hidden", "true");
    node.className = this.options.overlayClassName;
    target.prepend(node);
  }
}
