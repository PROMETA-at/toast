export class ToastMessage extends HTMLElement {
    connectedCallback() {
        // We won't render anything, but we also don't want to render our own children.
        this.attachShadow({ mode: 'closed' })
    }

    spawn() {
        const toastNode = document.createElement('dialog')
        toastNode.setAttribute('open', '')
        toastNode.classList = this.classList
        toastNode.classList.add('toast-message')
        toastNode.innerHTML = this.innerHTML

        const container = this.containerNode
        container.appendChild(toastNode);

        this.dispatchEvent(new CustomEvent('toast-message:spawned', { detail: { el: toastNode }, bubbles: true }))

        toastNode.addEventListener('close', () => {
            toastNode.remove()
        })

        if (this.hasAttribute('auto-close')) {
            setTimeout(() => {
                toastNode.close()
            }, this.getAttribute('auto-close') || 5000)
        }
    }

    get containerNode() {
        if (this.hasAttribute('container'))
            return document.querySelector(`#${this.getAttribute('container')}`)

        const defaultContainer =
            document.querySelector('toast-container[default], .toast-container-default')
        if (defaultContainer) return defaultContainer

        return document.body
    }

    /**
     * Registers the toast controller which arranges the toast messages on the screen.
     */
    static registerController() {
        const sheet = new CSSStyleSheet()
        sheet.insertRule(`
            dialog.toast-message {
                margin: 1rem;
                position: fixed;
                inset: unset;
                bottom: 0;
                right: 0;
                transition: transform .3s linear;
                transform: translate(0, calc(var(--toast-offset, 0) * -1));
            }
        `)
        document.adoptedStyleSheets.push(sheet)

        const activeToasts = []
        document.addEventListener('toast-message:spawned', (e) => {
            const { el } = e.detail
            activeToasts.unshift(el)

            el.addEventListener('close', () => {
                activeToasts.splice(activeToasts.indexOf(el), 1)
                recalculateToastPositions()
            })

            recalculateToastPositions()
        })

        function recalculateToastPositions() {
            const rem = parseInt(getComputedStyle(document.documentElement).fontSize)
            let accumulatedOffset = 0
            activeToasts.forEach((dialog) => {
                dialog.style.setProperty("--toast-offset", `${accumulatedOffset}px`);
                accumulatedOffset += dialog.offsetHeight + rem
            })
        }
    }
}
customElements.define('toast-message', ToastMessage)
