#-- copyright
# OpenProject is a project management system.
#
# Copyright (C) 2012-2013 the OpenProject Foundation (OPF)
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License version 3.
#
# See doc/COPYRIGHT.rdoc for more details.
#++

require_relative 'migration_utils/text_references'

class MigratePlanningElementLinksInJournalNotes < ActiveRecord::Migration
  include Migration::Utils

  COLUMNS_PER_TABLE = {
    'journals' => { columns: ['notes'], update_journal: false },
  }

  def up
    COLUMNS_PER_TABLE.each_pair do |table, options|
      say_with_time_silently "Update text references for table #{table}" do
        update_text_references(table, options[:columns], options[:update_journal])
      end
    end
  end

  def down
    COLUMNS_PER_TABLE.each_pair do |table, options|
      say_with_time_silently "Restore text references for table #{table}" do
        restore_text_references(table, options[:columns], options[:update_journal])
      end
    end
  end
end
