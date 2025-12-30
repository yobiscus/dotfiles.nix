return {
	"RRethy/base16-nvim",
	dependencies = {
		"nvim-lualine/lualine.nvim",
		"nvim-tree/nvim-web-devicons",
	},
	config = function()
		function update_hl(name, changes)
			local old_hl = vim.api.nvim_get_hl(0, { name = name, link = false })
			local new_hl = vim.tbl_deep_extend("force", old_hl, changes)
			vim.api.nvim_set_hl(0, name, new_hl)
		end

		local function reload(pkg)
			package.loaded[pkg] = nil
			return require(pkg)
		end

		-- Main entrypoint on matugen reloads
		local function auxiliary_function()
			reload("yobiscus.colors-matugen")

			-- other theme customizations
			local colorscheme = require("base16-colorscheme")
			update_hl("TSFunction", { italic = true })
			update_hl("TSVariableBuiltin", { fg = colorscheme.colors.base09 })

			-- reloading base16 overwrites lualine configuration, reset it now
			require("lualine").setup({
				options = { theme = "base16" },
			})
		end

		-- Register an autocmd to listen for matugen updates
		vim.api.nvim_create_autocmd("Signal", {
			pattern = "SIGUSR1",
			callback = auxiliary_function,
		})

		-- call auxiliary function once to set it all up
		auxiliary_function()
	end,
}
