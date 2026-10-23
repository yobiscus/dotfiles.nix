return {
	{
		"https://github.com/lewis6991/gitsigns.nvim",
		config = function()
			local gitsigns = require("gitsigns")
			gitsigns.setup({
				attach_to_untracked = true,
			})

			-- modes
			vim.keymap.set("n", "<leader>gb", gitsigns.blame, { desc = "Toggle blame" })
			vim.keymap.set("n", "<leader>gc", gitsigns.show, { desc = "Toggle commit" })
			vim.keymap.set("n", "<leader>gq", gitsigns.setqflist, { desc = "Toggle quickfix list (buffer)" })
			vim.keymap.set("n", "<leader>gv", gitsigns.preview_hunk, { desc = "Toggle hunk preview" })
			vim.keymap.set("n", "<leader>gx", function()
				gitsigns.setqflist("all")
			end, { desc = "Toggle quickfix list (all)" })

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
	{
		"sindrets/diffview.nvim",
		cmd = {
			"DiffviewOpen",
			"DiffviewClose",
			"DiffviewFileHistory",
		},
		keys = {
			{ "<leader>gd", "<cmd>DiffviewOpen<cr>", desc = "Diff uncommitted changes" },
			{ "<leader>gD", "<cmd>DiffviewOpen --cached<cr>", desc = "Diff staged changes" },
			{ "<leader>gC", "<cmd>DiffviewOpen HEAD^!<cr>", desc = "Diff latest commit" },
			{
				"<leader>gh",
				function()
					local count = vim.v.count > 0 and vim.v.count or 50
					vim.cmd("DiffviewFileHistory -n" .. count .. " --reverse")
				end,
				desc = "Review recent commits",
			},
			{ "<leader>gH", "<cmd>DiffviewFileHistory %<cr>", desc = "Review current file history" },
			{ "<leader>gQ", "<cmd>DiffviewClose<cr>", desc = "Close diff view" },
		},
	},
}
