return {
	"neovim/nvim-lspconfig",
	dependencies = { "saghen/blink.cmp" },
	opts = {
		servers = {
			bashls = {},
			clangd = {},
			lua_ls = {},
			perlnavigator = {},
			rust_analyzer = {
				settings = {
					["rust-analyzer"] = {
						cargo = {
							allFeatures = true,
						},
						check = {
							command = "clippy",
						},
						checkOnSave = true,
						inlayHints = {
							parameterHints = { enable = true },
							typeHints = { enable = true },
							implicitDrops = { enable = true },
						},
						procMacro = {
							ignored = {
								leptos_macro = {
									"server",
								},
							},
						},
					},
				},
			},
			tailwindcss = {
				filetypes = {
					"html",
					"css",
					"javascript",
					"typescript",
					"javascriptreact",
					"typescriptreact",
					"rust",
				},
				settings = {
					tailwindCSS = {
						classAttributes = { "class", "className", "class:list", "classList", "ngClass" },
						includeLanguages = {
							rust = "html",
						},
						experimental = {
							classRegex = {
								[[class:?\s*"(.*)"]], -- Matches class: "..." or class "..."
								[[(?:class|className)\s*=\s*"([^"]*)]], -- Matches class="..."
							},
						},
					},
				},
			},
		},
	},
	config = function(_, opts)
		-- configure servers, augment LSP capabilities with blink.cmp
		local blink = require("blink.cmp")
		for server, config in pairs(opts.servers) do
			config.capabilities = blink.get_lsp_capabilities(config.capabilities)
			vim.lsp.config(server, config)
			vim.lsp.enable(server)
		end

		-- inlay hints as virtual text, toggleable
		vim.diagnostic.config({ virtual_text = true })
		vim.keymap.set("n", "<leader>li", function()
			vim.lsp.inlay_hint.enable(not vim.lsp.inlay_hint.is_enabled())
		end, { desc = "toggle inlay hints" })
		vim.lsp.inlay_hint.enable(true)

		-- other lsp hotkeys
		vim.keymap.set("n", "gl", vim.diagnostic.open_float, { desc = "open diagnostic" })
	end,
}
