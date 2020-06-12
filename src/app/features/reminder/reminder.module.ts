import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReminderService} from './reminder.service';
import {NoteModule} from '../note/note.module';
import {MatDialog} from '@angular/material/dialog';
import {IS_ELECTRON} from '../../app.constants';
import {TasksModule} from '../tasks/tasks.module';
import {filter} from 'rxjs/operators';
import {Reminder} from './reminder.model';
import {ElectronService} from '../../core/electron/electron.service';
import {UiHelperService} from '../ui-helper/ui-helper.service';
import {NotifyService} from '../../core/notify/notify.service';
import {throttle} from 'throttle-debounce';
import {DialogViewNoteReminderComponent} from '../note/dialog-view-note-reminder/dialog-view-note-reminder.component';
import {DialogViewTaskReminderComponent} from '../tasks/dialog-view-task-reminder/dialog-view-task-reminder.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    NoteModule,
    TasksModule,
  ],
})
export class ReminderModule {
  private _throttledShowNotification = throttle(60000, this._showNotification.bind(this));

  constructor(
    private readonly _reminderService: ReminderService,
    private readonly _matDialog: MatDialog,
    private readonly _electronService: ElectronService,
    private readonly _uiHelperService: UiHelperService,
    private readonly _notifyService: NotifyService,
  ) {
    _reminderService.init();
    this._reminderService.onRemindersActive$.pipe(
      // NOTE: we simply filter for open dialogs, as reminders are re-queried quite often
      filter((reminder) => this._matDialog.openDialogs.length === 0 && !!reminder && reminder.length > 0),
    ).subscribe((reminders: Reminder[]) => {

      if (IS_ELECTRON) {
        this._uiHelperService.focusApp();
      }

      this._throttledShowNotification(reminders);

      const oldest = reminders[0];
      if (oldest.type === 'NOTE') {
        this._matDialog.open(DialogViewNoteReminderComponent, {
          autoFocus: false,
          restoreFocus: true,
          data: {
            reminder: oldest,
          }
        });
      } else if (oldest.type === 'TASK') {

        this._matDialog.open(DialogViewTaskReminderComponent, {
          autoFocus: false,
          restoreFocus: true,
          data: {
            reminder: oldest,
          }
        }).afterClosed();
      }
    });
  }

  private _showNotification(reminders: Reminder[]) {
    const isMultiple = reminders.length > 1;
    const title = isMultiple
      ? '"' + reminders[0].title + '" and ' + (reminders.length - 1) + ' other tasks are due.'
      : reminders[0].title;
    const tag = reminders.reduce((acc, reminder) => acc + '_' + reminder.id, '');

    this._notifyService.notify({
      title,
      // prevents multiple notifications on mobile
      tag,
      requireInteraction: true,
    }).then();
  }

}
