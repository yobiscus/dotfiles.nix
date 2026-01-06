return {
	{
		"olimorris/codecompanion.nvim",
		version = "^18.0.0",
		opts = {},
		dependencies = {
			"nvim-lua/plenary.nvim",
			"nvim-treesitter/nvim-treesitter",
			"ravitemer/mcphub.nvim",
		},
		keys = {
			{ "<leader>ac", "<cmd>CodeCompanionChat Toggle<cr>", desc = "AI Chat" },
			{ "<leader>ax", "<cmd>CodeCompanionActions<cr>", desc = "AI Actions" },
		},
		config = function()
			require("codecompanion").setup({
				strategies = {
					background = { adatapter = "anthropic" },
					chat = { adapter = "anthropic" },
					cmd = { adapter = "anthropic" },
					inline = { adapter = "anthropic" },
				},
				adapters = {
					http = {
						anthropic = function()
							return require("codecompanion.adapters").extend("anthropic", {
								env = {
									api_key = "cmd:cat $HOME/.keys/anthropic_api.key",
								},
							})
						end,
						copilot = function()
							-- Use Claude Sonnet 4.5 (premium) as default
							return require("codecompanion.adapters").extend("copilot", {
								schema = { model = { default = "claude-sonnet-4.5" } },
							})
						end,
					},
				},
				extensions = {
					mcphub = {
						callback = "mcphub.extensions.codecompanion",
						opts = {
							make_vars = true,
							make_slash_commands = true,
							show_result_in_chat = true,
						},
					},
				},
				-- display = {
				-- 	chat = {
				-- 		window = {
				-- 			layout = "float",
				-- 		},
				-- 	},
				-- },
			})
		end,
	},
	{
		"ravitemer/mcphub.nvim",
		dependencies = {
			"nvim-lua/plenary.nvim",
		},
		build = "npm install -g mcp-hub@latest",
		config = function()
			require("mcphub").setup()
		end,
	},
	{
		"folke/sidekick.nvim",
		opts = {
			copilot = { status = { enabled = false } },
			cli = {
				win = {
					layout = "right",
					split = { width = 70, height = 20 },
				},
				mux = {
					enabled = true,
					backend = "tmux",
					create = "split",
					split = {
						vertical = true, -- vertical or horizontal split
						size = 0.3, -- size of the split (0-1 for percentage)
					},
				},
			},
		},
		keys = {
			{
				"<leader>aa",
				function()
					require("sidekick.cli").toggle({ name = "opencode" })
				end,
				desc = "Sidekick Toggle CLI",
			},
			{
				"<leader>as",
				function()
					require("sidekick.cli").select({ filter = { installed = true } })
				end,
				desc = "Select CLI",
			},
			{
				"<leader>ad",
				function()
					require("sidekick.cli").close()
				end,
				desc = "Detach a CLI Session",
			},
			{
				"<leader>at",
				function()
					require("sidekick.cli").send({ msg = "{this}" })
				end,
				mode = { "x", "n" },
				desc = "Send This",
			},
			{
				"<leader>af",
				function()
					require("sidekick.cli").send({ msg = "{file}" })
				end,
				desc = "Send File",
			},
			{
				"<leader>av",
				function()
					require("sidekick.cli").send({ msg = "{selection}" })
				end,
				mode = { "x" },
				desc = "Send Visual Selection",
			},
			{
				"<leader>ap",
				function()
					require("sidekick.cli").prompt()
				end,
				mode = { "n", "x" },
				desc = "Sidekick Select Prompt",
			},
		},
	},
	-- {
	--   "echasnovski/mini.diff",
	--   config = function()
	--     local diff = require("mini.diff")
	--     diff.setup({
	--       -- Disabled by default
	--       source = diff.gen_source.none(),
	--     })
	--   end,
	-- },
	-- {
	--   "zbirenbaum/copilot.lua",
	--   event = "InsertEnter",
	--   opts = {
	--     panel = { enabled = false },
	--     suggestion = {
	--       keymap = {
	--         -- Disable the built-in mapping, we'll configure it in nvim-cmp.
	--         accept = false,
	--         accept_word = '<M-w>',
	--         accept_line = '<M-l>',
	--         next = '<M-]>',
	--         prev = '<M-[>',
	--         dismiss = '<Esc>',
	--       },
	--     },
	--     filetypes = {
	--       markdown = true,
	--       gitcommit = true,
	--       yaml = true,
	--     },
	--   },
	-- },
}
