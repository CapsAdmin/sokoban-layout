import React, { CSSProperties, ReactNode } from "react";
import logo from "./logo.svg";
import "./App.css";
class Rectangle {
  element: HTMLElement;
  constructor(parent: HTMLElement, fromElement?: HTMLElement) {
    if (fromElement) {
      this.element = fromElement;
    } else {
      const element = document.createElement("div");
      element.style.position = "absolute";
      element.style.overflow = "hidden";
      parent.appendChild(element);
      this.element = element;
    }
  }

  set x(x: number) {
    this.element.style.left = x + "px";
  }
  get x(): number {
    return parseInt(this.element.style.left);
  }

  set y(y: number) {
    this.element.style.top = y + "px";
  }
  get y(): number {
    return parseInt(this.element.style.top);
  }

  set w(width: number) {
    this.element.style.width = width + "px";
  }
  get w(): number {
    return parseInt(this.element.style.width);
  }

  set h(height: number) {
    this.element.style.height = height + "px";
  }
  get h(): number {
    return parseInt(this.element.style.height);
  }

  set color(color: string) {
    this.element.style.backgroundColor = color;
  }

  get color(): string {
    return this.element.style.backgroundColor;
  }

  get children(): Rectangle[] {
    let out = [];
    for (let child of this.element.children) {
      out.push(new Rectangle(child as HTMLElement, child as HTMLElement));
    }
    return out;
  }

  get parent(): Rectangle {
    return new Rectangle(
      this.element.parentElement as HTMLElement,
      this.element.parentElement as HTMLElement
    );
  }

  equals(rect: Rectangle): boolean {
    return this.element === rect.element;
  }

  worldRect(): [number, number, number, number] {
    const rect = this.element.getBoundingClientRect();
    return [this.x, this.y, this.x + this.w, this.y + this.h];
  }

  rayCast(ray: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  }) {
    const parent = this.parent;

    const dir = {
      x: ray.end.x - ray.start.x,
      y: ray.end.y - ray.start.y,
    };

    const [a_lft, a_top, a_rgt, a_btm] = this.worldRect();
    const found = [];

    for (const b of parent.children) {
      if (b.equals(this)) {
        continue;
      }

      const [b_lft, b_top, b_rgt, b_btm] = b.worldRect();

      if (
        (b_lft <= a_lft && b_rgt >= a_rgt) ||
        (b_lft >= a_lft && b_rgt <= a_rgt) ||
        (b_rgt > a_rgt && b_lft < a_rgt) ||
        (b_rgt > a_lft && b_lft < a_lft)
      ) {
        if (dir.y > 0 && b_top > a_top) {
          found.push({ child: b, point: b_top });
        } else if (dir.y < 0 && b_btm < a_btm) {
          found.push({ child: b, point: b_btm });
        }
      }

      if (
        (b_top <= a_top && b_btm >= a_btm) ||
        (b_top >= a_top && b_btm <= a_btm) ||
        (b_btm > a_btm && b_top < a_btm) ||
        (b_btm > a_top && b_top < a_top)
      ) {
        if (dir.x > 0 && b_rgt > a_rgt) {
          found.push({ child: b, point: b_lft });
        } else if (dir.x < 0 && b_lft < a_lft) {
          found.push({ child: b, point: b_rgt });
        }
      }
    }

    let origin = 0;
    if (dir.y > 0) {
      origin = a_btm;
    } else if (dir.y < 0) {
      origin = a_top;
    } else if (dir.x > 0) {
      origin = a_rgt;
    } else if (dir.x < 0) {
      origin = a_lft;
    }

    found.sort((a, b) => {
      return Math.abs(a.point - origin) - Math.abs(b.point - origin);
    });

    let hitPos = ray.end;

    if (found.length > 0) {
      let child = found[0].child;

      hitPos = { x: child.x, y: child.y };

      console.log(hitPos);

      if (dir.x < 0) {
        hitPos.y = this.y;
        hitPos.x = hitPos.x + child.w;
      } else if (dir.x > 0) {
        hitPos.y = this.y;
        hitPos.x = hitPos.x - this.w;
      } else if (dir.y < 0) {
        hitPos.x = this.x;
        hitPos.y = hitPos.y + child.h;
      } else if (dir.y > 0) {
        hitPos.x = this.x;
        hitPos.y = hitPos.y - this.h;
      }
    }

    return { hitPos, child: found[0]?.child };
  }

  moveRight() {
    const parent = this.parent;
    const res = this.rayCast({
      start: { x: this.x, y: this.y },
      end: { x: parent.w - this.w, y: this.y },
    });

    this.x = res.hitPos.x;
    return this;
  }

  moveLeft() {
    const parent = this.parent;
    const res = this.rayCast({
      start: { x: this.x, y: this.y },
      end: { x: 0, y: this.y },
    });

    this.x = res.hitPos.x;
    return this;
  }

  moveUp() {
    const parent = this.parent;
    const res = this.rayCast({
      start: { x: this.x, y: this.y },
      end: { x: this.x, y: 0 },
    });

    this.y = res.hitPos.y;
    return this;
  }

  moveDown() {
    const parent = this.parent;
    const res = this.rayCast({
      start: { x: this.x, y: this.y },
      end: { x: this.x, y: parent.h - this.h },
    });

    this.y = res.hitPos.y;
    return this;
  }

  stretchRight() {
    const parent = this.parent;
    const res = this.rayCast({
      start: { x: this.x, y: this.y },
      end: { x: parent.w, y: this.y },
    });

    this.w = res.hitPos.x;
    return this;
  }

  stretchLeft() {
    const parent = this.parent;
    const res = this.rayCast({
      start: { x: this.x, y: this.y },
      end: { x: 0, y: this.y },
    });

    const x = this.x + this.w;
    this.x = res.hitPos.x;
    this.w = x - res.hitPos.x;
    return this;
  }

  stretchUp() {
    const parent = this.parent;
    const res = this.rayCast({
      start: { x: this.x, y: this.y },
      end: { x: this.x, y: 0 },
    });

    const y = this.y + this.h;
    this.y = res.hitPos.y;
    this.h = y - res.hitPos.y;
    return this;
  }

  stretchDown() {
    const parent = this.parent;
    const res = this.rayCast({
      start: { x: this.x, y: this.y },
      end: { x: this.x, y: parent.h },
    });

    this.h = res.hitPos.y;
    return this;
  }

  centerXParent() {
    const parent = this.parent;
    const res = this.rayCast({
      start: { x: this.x, y: this.y },
      end: { x: parent.w / 2, y: this.y },
    });

    this.x = res.hitPos.x - this.w / 2;
    return this;
  }

  centerYParent() {
    const parent = this.parent;
    const res = this.rayCast({
      start: { x: this.x, y: this.y },
      end: { x: this.x, y: parent.h / 2 },
    });

    this.y = res.hitPos.y - this.h / 2;
    return this;
  }

  stretchToChildren() {
    const rect = this.element.getBoundingClientRect();
    const R = {
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right,
    };

    const oldWidth = this.element.style.width;
    const oldHeight = this.element.style.width;
    this.element.style.width = "auto";
    this.element.style.height = "auto";

    for (let e of this.element.childNodes) {
      const child = e as HTMLElement;
      const childRect = child.getBoundingClientRect();

      R.top = Math.min(R.top, childRect.top);
      R.bottom = Math.max(R.bottom, childRect.bottom);
      R.left = Math.min(R.left, childRect.left);
      R.right = Math.max(R.right, childRect.right);
    }
    this.element.style.width = oldWidth;
    this.element.style.height = oldHeight;

    this.x = R.left;
    this.y = R.top;
    this.w = R.right - R.left;
    this.h = R.bottom - R.top;
    return this;
  }
}

const Rect = (props: {
  style?: CSSProperties;
  children?: ReactNode;
  cmd: (r: Rectangle) => void;
}) => {
  return (
    <div
      style={{
        width: 1,
        height: 1,
        top: 0,
        left: 0,
        position: "absolute",
        overflow: "hidden",
        ...props.style,
      }}
      ref={(e) => {
        if (e) {
          const r = new Rectangle(e, e);

          props.cmd(r);
        }
      }}
    >
      {props.children}
    </div>
  );
};

function App() {
  return (
    <div
      style={{
        position: "absolute",
        top: 50,
        left: 50,
        width: 500,
        height: 800,
        backgroundColor: "red",
      }}
    >
      <Rect
        style={{ backgroundColor: "green" }}
        cmd={(r) => r.stretchToChildren().moveUp().stretchLeft().stretchRight()}
      >
        <Rect
          style={{ backgroundColor: "blue" }}
          cmd={(r) => r.stretchToChildren().centerYParent().moveLeft()}
        >
          <div>eliashogstvedt</div>
        </Rect>
        <Rect
          style={{ backgroundColor: "blue" }}
          cmd={(r) => r.stretchToChildren().centerYParent().moveLeft()}
        >
          <div>eliashogstvedt</div>
        </Rect>
      </Rect>
    </div>
  );
}

export default App;
