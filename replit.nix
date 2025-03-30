{pkgs}: {
  deps = [
    pkgs.gnomeExtensions.net-speed
    pkgs.emacsPackages.solo-jazz-theme
    pkgs.cudaPackages.cuda_nvprof
    pkgs.libcardiacarrest
    pkgs.rPackages.apportion
    pkgs.rPackages.neatR
    pkgs.haskellPackages.dependent-map_0_2_4_0
    pkgs.python311Packages.aionanoleaf
    pkgs.python311Packages.pixel-ring
    pkgs.rPackages.motifbreakR
    pkgs.rubyPackages_3_2.forwardable-extended
    pkgs.ppsspp-qt
    pkgs.gnomeExtensions.window-calls-extended
    pkgs.haskellPackages.phonetic-languages-phonetics-basics
    pkgs.ipscan
    pkgs.sbclPackages.cl-glfw-opengl-sgis__texture__filter4
    pkgs.lua51Packages.luatext
    pkgs.python312Packages.nvdlib
    pkgs.leiningen
    pkgs.bsequencer
    pkgs.sbclPackages.lispqr
    pkgs.haskellPackages.optimusprime
    pkgs.gnomeExtensions.eortologio-extension
    pkgs.lomiri.lomiri-wallpapers
    pkgs.emacsPackages.flycheck-clangcheck
    pkgs.miniball
    pkgs.rPackages.DIME
    pkgs.rPackages.AllPossibleSpellings
    pkgs.deepin.dwayland
    pkgs.nodePackages.prettier
    pkgs.postgresql{ pkgs }: {
      deps = [
        pkgs.nodejs
      ];
    }
  ];
}
