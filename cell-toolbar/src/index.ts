// Import necessary dependencies from React, JupyterLab, and other modules
import * as React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel, NotebookActions } from '@jupyterlab/notebook';
import { ICellFooter, Cell } from '@jupyterlab/cells';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { CommandRegistry } from '@lumino/commands';
import { IEditorServices } from '@jupyterlab/codeeditor';

import '@fortawesome/fontawesome-free/css/all.min.css';

// Define CSS classes used in the cell footer.
const CSS_CLASSES = {
  CELL_FOOTER: 'jp-CellFooter',
  CELL_FOOTER_DIV: 'ccb-cellFooterContainer',
  CELL_FOOTER_BUTTON: 'ccb-cellFooterBtn',
  CUSTOM_OUTPUT_AREA: 'custom-output-area', 
};

// Define command constants
const COMMANDS = {
  RUN_SELECTED_CODECELL: 'run-selected-codecell',
  INTERRUPT_KERNEL: 'notebook:interrupt-kernel',
  CLEAR_SELECTED_OUTPUT: 'clear-output-cell',
};


// Function to activate custom commands
function activateCommands(app: JupyterFrontEnd, tracker: INotebookTracker): Promise<void> {
  // Output a message to the console to indicate activation
  console.log('JupyterLab extension celltool_bar is activated!');

  // Wait for the app to be restored before proceeding
  Promise.all([app.restored]).then(([params]) => {
    const { commands, shell } = app;

    // Function to get the current NotebookPanel
    function getCurrent(args: ReadonlyPartialJSONObject): NotebookPanel | null {
      const widget = tracker.currentWidget;
      const activate = args.activate !== false;

      if (activate && widget) {
        shell.activateById(widget.id);
      }

      return widget;
    }

    /**
    * Function to check if the command should be enabled.
    * It checks if there is a current notebook widget and if it matches the app's current widget.
    * If both conditions are met, the command is considered enabled.
    */
    function isEnabled(): boolean {
      return (
        tracker.currentWidget !== null &&
        tracker.currentWidget === app.shell.currentWidget
      );
    }


    // Define a command to run the code in the current cell
    commands.addCommand(COMMANDS.RUN_SELECTED_CODECELL, {
      label: 'Run Cell',
      execute: args => {
        const current = getCurrent(args);
        if (current) {
          const { context, content } = current;
          NotebookActions.run(content, context.sessionContext);          
        }
      },
      isEnabled
    });

    commands.addCommand(COMMANDS.CLEAR_SELECTED_OUTPUT, {
      label: 'Clear Output',
      execute: args => {
        const current = getCurrent(args);
        if (current) {
          const { content } = current;
          NotebookActions.clearOutputs(content);
        }
      },
      isEnabled
    });
  });


return Promise.resolve();
}

/**
 * Extend the default implementation of an `IContentFactory`.
 */
export class ContentFactoryWithFooterButton extends NotebookPanel.ContentFactory {
  constructor(commands: CommandRegistry, options: Cell.ContentFactory.IOptions) {
    super(options);
    this.commands = commands;
  }
  /**
   * Create a new cell header for the parent widget.
   */
  createCellFooter(): ICellFooter {
    return new CellFooterWithButton(this.commands);
  }

  private readonly commands: CommandRegistry;
}

/**
 * Extend the default implementation of a cell footer with custom buttons.
 */
export class CellFooterWithButton extends ReactWidget implements ICellFooter {
  private readonly commands: CommandRegistry;
  private RUN_ICON = 'fa-solid fa-circle-play';
  private CLEAR_ICON = 'fa-solid fa-ban';
  private STOP_ICON = 'fa-solid fa-stop';

  constructor(commands: CommandRegistry) {
    super();
    this.addClass(CSS_CLASSES.CELL_FOOTER);
    this.commands = commands;

  }

  render() {

        
    return React.createElement("div", {className: CSS_CLASSES.CELL_FOOTER_DIV }, 
        React.createElement("div",{
          className: 'jp-Placeholder-prompt jp-InputPrompt',
        },
        ),
        React.createElement("button",{
          className: CSS_CLASSES.CELL_FOOTER_BUTTON,
          title: "Run this cell", //tooltip text
          onClick: () => {
            this.commands.execute(COMMANDS.RUN_SELECTED_CODECELL);
          },
        },
        React.createElement("i", { className: this.RUN_ICON })
        ),
        React.createElement("button",{
          className: CSS_CLASSES.CELL_FOOTER_BUTTON,
          title: "Interrupt Execution", //tooltip text
          onClick: () => {
            this.commands.execute(COMMANDS.INTERRUPT_KERNEL);
          },
        },
        React.createElement("i", { className: this.STOP_ICON })
        ),
        React.createElement("button", {
          className: CSS_CLASSES.CELL_FOOTER_BUTTON,
          title: "Clear cell output", //tooltip text
          onClick: () => {
            this.commands.execute(COMMANDS.CLEAR_SELECTED_OUTPUT);
          },
        },
        React.createElement("i", { className: this.CLEAR_ICON })
        )
    );
  }
}

/**
 * Define a JupyterLab extension to add footer buttons to code cells.
 */
const footerButtonExtension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-aaVisualPolish',
  autoStart: true,
  activate: activateCommands,
  requires: [INotebookTracker]
};

/**
 * Define a JupyterLab extension to override the default notebook cell factory.
 */
const cellFactory: JupyterFrontEndPlugin<NotebookPanel.IContentFactory> = {
  id: 'jupyterlab-aaVisualPolish:factory',
  provides: NotebookPanel.IContentFactory,
  requires: [IEditorServices],
  autoStart: true,
  activate: (app: JupyterFrontEnd, editorServices: IEditorServices) => {
    const { commands } = app;
    const editorFactory = editorServices.factoryService.newInlineEditor;
    return new ContentFactoryWithFooterButton(commands, { editorFactory });
  }
};

/**
 * Export this plugins as default.
 */
const plugins: Array<JupyterFrontEndPlugin<any>> = [
  footerButtonExtension,
  cellFactory
];

export default plugins;