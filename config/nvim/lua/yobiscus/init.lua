vim.g.mapleader = " "

-- settings
vim.opt.mouse = ""
vim.opt.undofile = true
vim.opt.splitbelow = true
vim.opt.splitright = true
vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.list = true
vim.opt.listchars = { tab = "▸ ", trail = "·", nbsp = "␣", extends = ">", precedes = "<" }
vim.opt.shell = "/bin/bash" -- fish shell for example is much slower

-- keymaps
vim.keymap.set("n", "<leader>on", "<cmd>Ex<cr>", { desc = "Netrw" })
vim.keymap.set("n", "<leader>oc", function()
	vim.cmd("lcd ~/.dotfiles/config/nvim")
	vim.cmd("e lua/yobiscus/init.lua")
end, { desc = "Neovim config" })

vim.keymap.set("v", ">", ">gv")
vim.keymap.set("v", "<", "<gv")

-- toggle between filetypes
vim.keymap.set("n", "<leader>ec", ":e %:r.c<cr>", { desc = ".c" })
vim.keymap.set("n", "<leader>eh", ":e %:r.h<cr>", { desc = ".h" })
vim.keymap.set("n", "<leader>eg", function()
	local ext_map = {
		["c"] = "h",
		["h"] = "c",
	}
	local ext = ext_map[vim.fn.expand("%:e")]
	vim.cmd("e %:r." .. ext)
end, { desc = "guess" })

--
vim.cmd([[
hi NonText ctermbg=none guibg=NONE
hi Normal guibg=NONE ctermbg=NONE
hi NormalNC guibg=NONE ctermbg=NONE
hi SignColumn ctermbg=NONE ctermfg=NONE guibg=NONE

hi Pmenu ctermbg=NONE ctermfg=NONE guibg=NONE
hi FloatBorder ctermbg=NONE ctermfg=NONE guibg=NONE
hi NormalFloat ctermbg=NONE ctermfg=NONE guibg=NONE
hi TabLine ctermbg=None ctermfg=None guibg=None
]])

-- plugins
require("yobiscus.lazy")
