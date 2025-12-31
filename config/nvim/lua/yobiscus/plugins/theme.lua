return {
	"RRethy/base16-nvim",
	dependencies = {
		"nvim-lualine/lualine.nvim",
		"nvim-tree/nvim-web-devicons",
	},
	config = function()
		local function reload(pkg)
			package.loaded[pkg] = nil
			return require(pkg)
		end

		-- Main entrypoint on matugen reloads
		local function auxiliary_function()
			local colors = reload("yobiscus.colors-matugen")
			colors.reset_colors()
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
