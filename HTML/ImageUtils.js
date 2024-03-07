export function CreateImageDiv(canvas, image) {
    const div = document.createElement("div");
    div.className = "UI";
    const img = document.createElement("img");

    div.hidden = !image.visible;

    img.src = image.url;
    img.setAttribute("hidden", "hidden");

    img.onload = (() => {
        img.style.width = (image.scaledWidth ?? img.naturalWidth) + "px";
        img.style.height = (image.scaledHeight ?? img.naturalHeight) + "px";

        div.style.zIndex = "1";
        div.style.backgroundImage = "url('" + image.url + "')";
        div.style.position = "absolute";

        div.style.width = img.style.width;
        div.style.height = img.style.height;

        if (image.centered) {
            div.setAttribute("horizontal-align", "centered");
            div.style.setProperty("margin-left", `calc(50% - ${parseInt(img.style.width) / 2}px)`);
        }
        else if (image.right){
            div.setAttribute("horizontal-align", "right");
            div.style.setProperty("margin-left", `calc(100% - ${parseInt(img.style.width)}px)`);
        }
        else {
            div.setAttribute("horizontal-align", "left");
            div.style.marginLeft = image.x + "px";
        }
        if (image.mid) {
            div.setAttribute("vertical-align", "mid");
            div.style.setProperty("margin-top", `calc(50% - ${parseInt(img.style.height) / 2}px)`);
        }
        else if (image.bot) {
            div.setAttribute("vertical-align", "bot");
            div.style.setProperty("margin-top", `calc(${canvas.getBoundingClientRect().height}px - ${parseInt(img.style.height)}px)`)
        }
        else {
            div.setAttribute("vertical-align", "top");
            div.style.marginTop = image.y + "px";
        }
    });

    div.setAttribute("fixed", image.fixed)

    div.appendChild(img);

    document.body.insertBefore(div, canvas.parentNode);

    return div;
}

export function ResizeImage(div, prevWidth, prevHeight, currWidth, currHeight) {
    const img = div.childNodes[0];

    if (div.getAttribute("fixed") === "true")
        return;

    const width = div.style.width;
    const height = div.style.height;
    const horizontalAlign = div.getAttribute("horizontal-align");
    const verticalAlign = div.getAttribute("vertical-align");

    if (horizontalAlign === "centered")
        div.style.setProperty("margin-left", `calc(50% - ${parseInt(width) / 2}px)`)
    else if (horizontalAlign === "right")
        div.style.setProperty("margin-left", `calc(100% - ${parseInt(width)}px)`)
    else {
        const maxX = parseInt(img.style.marginLeft.replace("px", ""));
        div.style.marginLeft = currWidth / 1920 * maxX + "px";
    }

    if (verticalAlign === "mid")
        div.style.setProperty("margin-top", `calc(50% - ${parseInt(height) / 2}px)`)
    else if (verticalAlign === "bot")
        div.style.setProperty("margin-top", `calc(${currHeight - parseInt(height)}px)`)
    else {
        const maxY = parseInt(img.style.marginTop.replace("px", ""));
        div.style.marginTop = currHeight / 1045 * maxY + "px";
    }
}

export function ReCalcImage(div, newProperties) {
    div.hidden = !newProperties.visible;
    /* Width is given in % */
    const width = div.childNodes[0].style.width;
    const height = div.childNodes[0].style.height;

    if (newProperties.width)
        div.style.width = (newProperties.width * parseInt(width)) + "px";

    if (newProperties.x)
        div.style.marginLeft = newProperties.x + (parseInt(width) / 2) + "px";

    if (newProperties.y)
        div.style.marginTop = newProperties.y + (parseInt(height) / 2) + "px";
}