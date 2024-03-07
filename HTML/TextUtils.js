export function CreateText(canvas, text) {
    const txt = document.createElement(text.htmlType);
    if (!text.visible)
        txt.setAttribute("hidden", "hidden");

    txt.innerText = text.text;

    txt.style.zIndex = "1";
    txt.style.position = "absolute";

    if (text.textWeight)
        txt.style.setProperty("fontWeight", text.textWeight);

    if (text.centered) {
        txt.setAttribute("horizontal-align", "centered");
        txt.style.setProperty;
    }
    else if (text.right) {
        txt.setAttribute("horizontal-align", "right");
        txt.style.setProperty("margin-left", `right`);
    }
    else {
        txt.setAttribute("horizontal-align", "left");
        txt.style.marginLeft = text.x + "px";
    }
    if (text.bot) {
        txt.setAttribute("vertical-align", "bot");
        txt.style.setProperty("margin-top", `calc(${canvas.getBoundingClientRect().height}px - ${txt.fontSize}px)`)
    }
    else {
        txt.setAttribute("vertical-align", "top");
        txt.style.marginTop = text.y + "px";
    }

    txt.setAttribute("fixed", text.fixed);

    document.body.insertBefore(txt, canvas.parentNode);

    return txt;
}