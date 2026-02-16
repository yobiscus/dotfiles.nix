return {
	{
		"https://github.com/lewis6991/gitsigns.nvim",
		config = function()
			local gitsigns = require("gitsigns")
			gitsigns.setup()

			-- modes
			vim.keymap.set("n", "<leader>gb", gitsigns.blame, { desc = "Toggle blame" })
			vim.keymap.set("n", "<leader>gv", gitsigns.preview_hunk, { desc = "Toggle hunk preview" })

			-- mutation
			vim.keymap.set("n", "<leader>gs", function()
				gitsigns.stage_hunk(nil, { greedy = false })
			end, { desc = "Stage hunk" })
			vim.keymap.set("v", "<leader>gs", function()
				gitsigns.stage_hunk({ vim.fn.line("."), vim.fn.line("v") }, { greedy = false })
			end, { desc = "Stage hunk (visual)" })

			-- navigation
			vim.keymap.set("n", "<leader>gn", function()
				gitsigns.nav_hunk("next", { greedy = false })
			end, { desc = "Next hunk" })
			vim.keymap.set("n", "<leader>gp", function()
				gitsigns.nav_hunk("prev", { greedy = false })
			end, { desc = "Prev hunk" })
		end,
	},
}
