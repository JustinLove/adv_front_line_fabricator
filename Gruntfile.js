var spec = require('./lib/spec')
var prompt = require('prompt')
prompt.start()

var modPath = '../../server_mods/com.wondible.pa.adv_front_line_fabricator/'
var stream = 'stable'
var media = require('./lib/path').media(stream)

var dup = function(obj) {
  return JSON.parse(JSON.stringify(obj))
}

module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    copy: {
      mod: {
        files: [
          {
            src: [
              'modinfo.json',
              'LICENSE.txt',
              'README.md',
              'CHANGELOG.md',
              'ui/**',
              'pa/**'],
            dest: modPath,
          },
        ],
      },
    },
    jsonlint: {
      all: {
        src: [
          'pa/anim/**/*.json',
          'pa/units/**/*.json'
        ]
      },
    },
    json_schema: {
      all: {
        files: {
          'lib/schema.json': [
            'pa/anim/**/*.json',
            'pa/units/**/*.json'
          ]
        },
      },
    },
    // copy files from PA, transform, and put into mod
    proc: {
      adv_comfab: {
        src: [
          'pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv.json',
          'pa/units/commanders/base_commander/base_commander.json'
        ],
        cwd: media,
        dest: 'pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv.json',
        process: function(acf, com) {
          delete acf.atrophy_rate
          delete acf.atrophy_cool_down
          delete acf.guard_layer
          acf.buildable_types = com.buildable_types + " | Defense & FabBuild | Recon & FabBuild"
          acf.command_caps.push('ORDER_Attack')
          acf.display_name = "Advanced Front Line Fabricator"
          acf.description = "The combat fabricator is fully armored and armed to provide build support in heavy fire situations."
          acf.max_health = com.max_health
          acf.navigation = com.navigation
          acf.events.fired = {
            "effect_spec": "/pa/effects/specs/default_muzzle_flash.pfx socket_muzzleFront"
          }
          acf.tools = com.tools.filter(function(tool) {
            if (tool.spec_id == "/pa/tools/commander_build_arm/commander_build_arm.json") {
              tool.aim_bone = 'bone_turretBack'
              tool.muzzle_bone = 'socket_muzzleBack'
              tool.record_index = 0
            } else {
              tool.aim_bone = 'bone_turretFront'
              tool.muzzle_bone = 'socket_muzzleFront'
              tool.record_index = 1
            }

            return tool.spec_id != '/pa/tools/uber_cannon/uber_cannon.json'
          })
          return acf
        }
      },
      adv_comfab_anim: {
        targets: [
          'pa/anim/anim_trees/fabrication_bot_combat_adv_anim_tree.json'
        ],
        process: function(spec) {
          var bt = spec.skeleton_controls[0]
          bt.child.weapon_index = 0

          var ft = dup(bt)
          ft.child.rotation_bone = 'bone_turretFront'
          ft.child.weapon_index = 1
          spec.skeleton_controls.push(ft)

          var bp = spec.skeleton_controls[1]
          bp.child.weapon_index = 0

          var fr = dup(bp)
          fr.child.rotation_bone = 'bone_recoil'
          fr.child.weapon_index = 1
          spec.skeleton_controls.push(ft)
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-jsonlint');
  grunt.loadNpmTasks('grunt-json-schema');

  grunt.registerMultiTask('proc', 'Process unit files into the mod', function() {
    if (this.data.targets) {
      var specs = spec.copyPairs(grunt, this.data.targets, media)
      spec.copyUnitFiles(grunt, specs, this.data.process)
    } else {
      var specs = this.filesSrc.map(function(s) {return grunt.file.readJSON(media + s)})
      var out = this.data.process.apply(this, specs)
      grunt.file.write(this.data.dest, JSON.stringify(out, null, 2))
    }
  })

  // Default task(s).
  grunt.registerTask('default', ['proc', 'json_schema', 'jsonlint', 'copy:mod']);

};

