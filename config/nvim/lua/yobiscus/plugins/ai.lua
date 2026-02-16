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
					background = { adatapter = "codex" },
					chat = { adapter = "codex" },
					cmd = { adapter = "codex" },
					inline = { adapter = "codex" },
				},
				adapters = {
					acp = {
						codex = function()
							return require("codecompanion.adapters").extend("codex", {
								defaults = {
									auth_method = "chatgpt",
								},
							})
						end,
						claude_code = function()
							return require("codecompanion.adapters").extend("claude_code", {
								env = {
									CLAUDE_CODE_OAUTH_TOKEN = "cmd:gopass show -o -f misc/claude-code-api | tr -d '\n'",
								},
							})
						end,
					},
					-- 	http = {
					-- 		anthropic = function()
					-- 			return require("codecompanion.adapters").extend("anthropic", {
					-- 				env = {
					-- 					api_key = "cmd:cat $HOME/.keys/anthropic_api.key",
					-- 				},
					-- 			})
					-- 		end,
					-- 	},
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
}
