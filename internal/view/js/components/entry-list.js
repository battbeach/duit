import {
	Button,
	LoadingSign
} from "./_components.min.js";

import {
	Big
} from "../libs/big.min.js"

import {
	mergeObject,
	formatDate,
	formatNumber,
} from "../libs/utils.min.js"

export function EntryList() {
	let lastSelectedRow = 0

	function toggleAllSelection(selection, nContents) {
		if (selection.length === nContents) {
			selection.splice(0, selection.length)
		} else {
			for (var row = 0; row < nContents; row++) {
				if (selection.indexOf(row) === -1) {
					selection.push(row)
				}
			}
		}
	}

	function toggleSelection(selection, row) {
		let idx = selection.indexOf(row)

		if (idx !== -1) selection.splice(idx, 1)
		else selection.push(row)

		lastSelectedRow = row
	}

	function selectRange(selection, row) {
		let start = lastSelectedRow,
			end = row

		if (start > end) {
			start = row
			end = lastSelectedRow
		}

		for (var i = start; i <= end; i++) {
			if (selection.indexOf(i) === -1) {
				selection.push(i)
			}
		}

		lastSelectedRow = row
	}

	function renderView(vnode) {
		// Parse attributes and set default value
		let account = vnode.attrs.account,
			entries = vnode.attrs.entries,
			loading = vnode.attrs.loading,
			className = vnode.attrs.class,
			selection = vnode.attrs.selection,
			currentPage = vnode.attrs.currentPage,
			maxPage = vnode.attrs.maxPage,
			onItemClicked = vnode.attrs.onItemClicked,
			onNewClicked = vnode.attrs.onNewClicked,
			onEditClicked = vnode.attrs.onEditClicked,
			onDeleteClicked = vnode.attrs.onDeleteClicked,
			onPageChanged = vnode.attrs.onPageChanged

		if (typeof account != "object") account = {}
		if (!Array.isArray(entries)) entries = []
		if (typeof loading != "boolean") loading = false
		if (typeof className != "string") className = ""
		if (!Array.isArray(selection)) selection = []
		if (typeof currentPage != "number") currentPage = 1
		if (typeof maxPage != "number") maxPage = 1
		if (typeof onItemClicked != "function") onItemClicked = () => { }
		if (typeof onNewClicked != "function") onNewClicked = () => { }
		if (typeof onEditClicked != "function") onEditClicked = () => { }
		if (typeof onDeleteClicked != "function") onDeleteClicked = () => { }
		if (typeof onPageChanged != "function") onPageChanged = () => { }

		// Render header
		let title = "Daftar Entry"
		if (account != null) {
			let name = account.name || "",
				total = account.total || "0"
			title = `${name}, ${formatNumber(total)}`
		}

		let headerContents = [m("p.entry-list__header__title", title)],
			headerButtonAttrs = {
				iconOnly: true,
				class: "entry-list__header__button",
			}

		if (entries.length > 0 && !loading) headerContents.unshift(
			m("input[type=checkbox].entry__check", {
				checked: selection.length === entries.length,
				onclick() { toggleAllSelection(selection, entries.length) }
			})
		)

		if (selection.length === 1) headerContents.push(
			m(Button, mergeObject(headerButtonAttrs, {
				icon: "fa-pen",
				caption: "Edit entry",
				onclick() { onEditClicked() }
			}))
		)

		if (selection.length >= 1) headerContents.push(
			m(Button, mergeObject(headerButtonAttrs, {
				icon: "fa-trash-alt",
				caption: "Delete entry",
				onclick() { onDeleteClicked() }
			}))
		)

		headerContents.push(m(Button, mergeObject(headerButtonAttrs, {
			icon: "fa-plus-circle",
			caption: "Entry baru",
			onclick() { onNewClicked() }
		})))

		let header = m(".entry-list__header", headerContents)

		// Render list content
		let contents = []

		if (loading) {
			contents.push(m(LoadingSign, { class: "entry-list__loading-sign" }))
		} else if (entries.length === 0) {
			contents.push(m("p.entry-list__empty-message", "Belum ada entry terdaftar"))
		} else {
			entries.forEach((entry, idx) => {
				// If this is a new date, put it into the list
				let prevEntry = entries[idx - 1]
				if (prevEntry == null || entry.date !== prevEntry.date) {
					contents.push(m("p.entry__date", formatDate(entry.date)))
				}

				// Prepare class name, amount and description
				let className = "",
					amount = Big(entry.amount),
					description = entry.description || ""

				switch (entry.type) {
					case 1:
						className = "entry--income"
						break
					case 2:
						className = "entry--expense"
						amount = amount.times(-1)
						break
					case 3:
						let accountId = account.id || -1,
							accountIsReceiver = accountId === entry.affectedAccountId,
							tmpDescription = ""

						if (accountIsReceiver) {
							tmpDescription = `Masuk dari ${entry.account}`
						} else {
							tmpDescription = `Masuk dari ${entry.affectedAccount}`
							amount = amount.times(-1)
						}

						className = "entry--transfer"
						description = description || tmpDescription
				}

				// Prepare check box
				let checkAttrs = {
					checked: selection.indexOf(idx) !== -1,
					onclick(e) {
						if (e.shiftKey) selectRange(selection, idx)
						else toggleSelection(selection, idx)
					},
					onkeydown(e) {
						if (e.code !== "Enter" && e.code !== "NumpadEnter") return
						if (e.shiftKey) selectRange(selection, idx)
						else toggleSelection(selection, idx)
					}
				}

				// Render the entry
				contents.push(m(".entry",
					m("input[type=checkbox].entry__check", checkAttrs),
					m("p.entry__description", description),
					m("p.entry__amount", { class: className }, formatNumber(amount)),
				))
			})

			contents.push(m(".entry-list__space"))
		}

		// If needed, add pagination as well
		if (maxPage > 1) {
			let attrs = {
				iconOnly: true,
				tooltipPosition: "top",
				class: "entry-list__footer__button",
			}

			let paginationEnabled = {
				first: !loading && currentPage > 2,
				prev: !loading && currentPage > 1,
				next: !loading && currentPage < maxPage,
				last: !loading && currentPage < maxPage - 1,
			}

			contents.push(m(".entry-list__footer",
				m(Button, mergeObject(attrs, {
					icon: "fa-angle-double-left",
					caption: "Halaman pertama",
					enabled: paginationEnabled.first,
					onclick() { onPageChanged(1) }
				})),
				m(Button, mergeObject(attrs, {
					icon: "fa-angle-left",
					caption: "Halaman sebelumnya",
					enabled: paginationEnabled.prev,
					onclick() { onPageChanged(currentPage - 1) }
				})),
				m("p.entry-list__footer__page", `${currentPage} / ${maxPage}`),
				m(Button, mergeObject(attrs, {
					icon: "fa-angle-right",
					caption: "Halaman selanjutnya",
					enabled: paginationEnabled.next,
					onclick() { onPageChanged(currentPage + 1) }
				})),
				m(Button, mergeObject(attrs, {
					icon: "fa-angle-double-right",
					caption: "Halaman terakhir",
					enabled: paginationEnabled.last,
					onclick() { onPageChanged(maxPage) }
				}))
			))
		}

		// Render final view
		return m(".entry-list",
			{ class: className },
			[header, contents])
	}

	return {
		view: renderView
	}
}